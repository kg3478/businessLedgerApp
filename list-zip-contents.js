import fs from 'fs';
import path from 'path';
import yauzl from 'yauzl';

// Install yauzl first if using this script
function listZipContents(zipFilePath) {
  yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
    if (err) throw err;
    
    console.log(`Contents of ${path.basename(zipFilePath)}:`);
    console.log('----------------------------------------');
    
    let count = 0;
    
    zipfile.on('entry', (entry) => {
      count++;
      // Print only the first 20 entries
      if (count <= 20) {
        console.log(entry.fileName);
      } else if (count === 21) {
        console.log('... (more files not shown)');
      }
      zipfile.readEntry();
    });
    
    zipfile.on('end', () => {
      console.log('----------------------------------------');
      console.log(`Total files in archive: ${count}`);
    });
    
    zipfile.readEntry();
  });
}

// Use the script with:
listZipContents('./business-ledger-app.zip');