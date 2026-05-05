const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkCertbot() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- CERTBOT VERSION ---')
    const version = await ssh.execCommand('certbot --version')
    console.log(version.stdout)

    console.log('--- NGINX STATUS ---')
    const status = await ssh.execCommand('systemctl status nginx')
    console.log(status.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkCertbot()
