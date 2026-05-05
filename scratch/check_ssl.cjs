const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkSsl() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- SEARCHING FOR comfortplus0777.com.ua IN SSL CONFIGS ---')
    const grep = await ssh.execCommand('grep -r "comfortplus0777.com.ua" /etc/nginx/sites-available/')
    console.log(grep.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkSsl()
