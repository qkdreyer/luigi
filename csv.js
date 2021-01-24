const parse = require('csv-parse')
const fs = require('fs')

const processFile = async file => {
  let records = []
  const parser = fs.createReadStream(file).pipe(parse())
  for await (const [record] of parser) {
    const [host, username, password, vendor] = record.split(';')
    if (host === 'host') {
      continue;
    }
    records.push({ host, username, password, vendor })
  }
  return records
}

module.exports = file => new Promise(async (resolve, reject) => {
  resolve(await processFile(file))
})
