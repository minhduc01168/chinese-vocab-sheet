const https = require('https');
const Papa = require('papaparse');
const { pinyin } = require('pinyin-pro');

const url = 'https://docs.google.com/spreadsheets/d/1Bw2Gv20NRcTdPRufPsIDdtdn7YxFzfdRfXVQyBOR3nA/gviz/tq?tqx=out:csv&gid=0';

function normalizeHeader(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function detectColumns(headers) {
  let hanziIdx = -1;
  let meaningIdx = -1;
  let pinyinIdx = -1;
  let sinoVietnameseIdx = -1;
  let exampleIdx = -1;
  let noteIdx = -1;

  headers.forEach((header, idx) => {
    const clean = normalizeHeader(header);
    if (!clean && !header.trim()) return;

    if (hanziIdx === -1) {
      if (
        clean.includes('hanzi') ||
        clean.includes('chuhan') ||
        clean.includes('tuvung') ||
        clean.includes('tiengtrung') ||
        clean.includes('tu') ||
        header.includes('汉字') ||
        header.includes('生词') ||
        header.includes('词语')
      ) {
        hanziIdx = idx;
        return;
      }
    }

    if (meaningIdx === -1) {
      if (
        clean.includes('nghia') ||
        clean.includes('meaning') ||
        clean.includes('dich') ||
        clean.includes('tiengviet') ||
        header.includes('意思') ||
        header.includes('越南语') ||
        header.includes('翻译')
      ) {
        meaningIdx = idx;
        return;
      }
    }

    if (pinyinIdx === -1) {
      if (
        clean.includes('pinyin') ||
        clean.includes('phienam') ||
        clean.includes('phienamtiengtrung') ||
        header.includes('拼音')
      ) {
        pinyinIdx = idx;
        return;
      }
    }

    if (sinoVietnameseIdx === -1) {
      if (
        clean.includes('hanviet') ||
        clean.includes('汉越') ||
        clean.includes('amhanviet')
      ) {
        sinoVietnameseIdx = idx;
        return;
      }
    }

    if (exampleIdx === -1) {
      if (
        clean.includes('vidu') ||
        clean.includes('example') ||
        clean.includes('例如') ||
        clean.includes('cauvd')
      ) {
        exampleIdx = idx;
        return;
      }
    }

    if (noteIdx === -1) {
      if (
        clean.includes('note') ||
        clean.includes('ghichu') ||
        clean.includes('tuloai') ||
        clean.includes('chuthich') ||
        clean.includes('loaitu')
      ) {
        noteIdx = idx;
        return;
      }
    }
  });

  return { hanziIdx, meaningIdx, pinyinIdx, sinoVietnameseIdx, exampleIdx, noteIdx };
}

function extractValidAnswers(hanzi) {
  const parts = hanzi.split(/[\/\n;；,，]+/).map(p => p.trim()).filter(Boolean);
  const results = [];
  for (const part of parts) {
    const cleaned = part.replace(/[（(].*?[）)]/g, '').trim();
    if (cleaned && !results.includes(cleaned)) {
      results.push(cleaned);
    }
    const match = part.match(/^(.*?)[（(](.*?)[）)]$/);
    if (match) {
      const base = match[1].trim();
      const paren = match[2].trim();
      if (base && !results.includes(base)) results.push(base);
      if (paren && !results.includes(paren)) results.push(paren);
      const combined = base + paren;
      if (combined && !results.includes(combined)) results.push(combined);
    }
  }
  return results.length > 0 ? results : (hanzi.trim() ? [hanzi.trim()] : []);
}

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    Papa.parse(data, {
      skipEmptyLines: 'greedy',
      complete: (results) => {
        const rows = results.data;
        console.log('Tổng số hàng PapaParse đọc được (kể cả Header):', rows.length);
        const headers = rows[0];
        console.log('Headers:', headers.slice(0, 7));
        const colMap = detectColumns(headers);
        console.log('Detected column indices:', colMap);
        console.log('Cột Hán tự là cột index:', colMap.hanziIdx, `("${headers[colMap.hanziIdx]}")`);
        console.log('Cột Nghĩa là cột index:', colMap.meaningIdx, `("${headers[colMap.meaningIdx]}")`);

        const parsedItems = [];
        const skippedRows = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const excelRow = i + 1; // Row 1 is header
          if (!row || row.length === 0) {
            skippedRows.push({ excelRow, reason: 'Dòng hoàn toàn rỗng', row });
            continue;
          }

          const rawHanzi = (row[colMap.hanziIdx] || '').trim();
          const rawMeaning = (row[colMap.meaningIdx] || '').trim();

          if (!rawHanzi) {
            skippedRows.push({ excelRow, stt: row[0], rawHanzi, rawMeaning, reason: 'Thiếu Chữ Hán (cột 汉字 rỗng)', row: row.slice(0, 6) });
            continue;
          }

          if (!rawMeaning) {
            skippedRows.push({ excelRow, stt: row[0], rawHanzi, rawMeaning, reason: 'Thiếu Nghĩa tiếng Việt (cột Nghĩa rỗng)', row: row.slice(0, 6) });
            continue;
          }

          const validAnswers = extractValidAnswers(rawHanzi);
          if (validAnswers.length === 0) {
            skippedRows.push({ excelRow, stt: row[0], rawHanzi, rawMeaning, reason: 'Không trích xuất được validAnswers', row: row.slice(0, 6) });
            continue;
          }

          parsedItems.push({
            excelRow,
            stt: row[0],
            hanzi: rawHanzi,
            meaning: rawMeaning,
            pinyin: row[colMap.pinyinIdx] || ''
          });
        }

        console.log('========================================================');
        console.log('KẾT QUẢ PHÂN TÍCH GOOGLE SHEET:');
        console.log(`- Tổng số hàng Papa.parse đọc được: ${rows.length}`);
        console.log(`- Hàng tiêu đề: Hàng 1`);
        console.log(`- Số hàng dữ liệu: ${rows.length - 1}`);
        console.log(`- Số từ vựng hợp lệ được trích xuất (parsedItems): ${parsedItems.length}`);
        console.log(`- Số hàng bị bỏ qua: ${skippedRows.length}`);
        console.log('\nDANH SÁCH CHI TIẾT CÁC HÀNG BỊ BỎ QUA:');
        skippedRows.forEach(s => {
          console.log(`  * Dòng Google Sheet (Excel Row) ${s.excelRow}: STT="${s.stt}", Hanzi="${s.rawHanzi}", Meaning="${s.rawMeaning}"`);
          console.log(`    -> Lý do bỏ qua: ${s.reason}`);
          console.log(`    -> Dữ liệu hàng:`, s.row);
        });

        console.log('========================================================');
        console.log('Kiểm tra dòng cuối cùng của parsedItems:');
        console.log(parsedItems.slice(-5));
      }
    });
  });
}).on('error', err => console.error(err));
