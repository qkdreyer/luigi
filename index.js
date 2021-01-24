const fs = require('fs')
const devnet = require('devnet-js')
const readline = require('readline')
const csv = require('./csv')

const commands = {
  aruba: 'copy startup-config tftp TFTP_HOST HOST_config.cfg\ncopy command-output "show tech" tftp TFTP_HOST HOST_show_tech.txt',
}

const connect = ({ host, username, password, command }, capture) => new Promise((resolve, reject) => {
  const ssh = new devnet.Defaultclass({ id: 'test' })

  ssh.openSshShell({
    credential: {
      host,
      port: 22,
      username,
      password,
    }
  }, stream => {
    if (stream) {
      console.log('connect successful')
      let output = ''
      stream.on('close', () => {
        if (output.length > 0) {
          const filename = `out/${command.replace(/\W/g, '_')}_${host}.txt`
          const data = output.replace(/\[24;1H\[2K\[24;1H\[1;24r\[24;1H/g, '')
          fs.writeFileSync(filename, data)
        }
        ssh.sshconn.end()
        resolve()
      }).on('data', data => {
        if (capture) {
          output += data
        }
      })

      ssh.streamSendkeys(` ${command}\nlogout\ny\n`, { autoenter: true, emit: true })
    } else {
      console.log('failed to connect')
      resolve()
    }
  })
})

;(function init(rl) {
  rl.question('Adresse IP du serveur TFTP ?\n', tftpHost => {
    if (!tftpHost) {
      return init(rl)
    }
    rl.close()

    csv('./data.csv').then(async items => {
      for (var itemIndex in items) {
        const { host, username, password, vendor } = items[itemIndex]
        const vendorCommands = commands[vendor].split('\n')
        for (var vendorCommandIndex in vendorCommands) {
          const command = vendorCommands[vendorCommandIndex].replace('TFTP_HOST', tftpHost).replace('HOST', host)
          console.log(`executing '${command.replace(/\n/, '; ')}' on ${username}@${host}`)
          await connect({ host, username, password, command }, !command.includes('tftp'))
        }
      }
    })
  })
})(readline.createInterface({
  input: process.stdin,
  output: process.stdout
}))
