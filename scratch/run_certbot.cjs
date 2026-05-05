const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function runCertbot() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- RUNNING CERTBOT ---')
    // Using --nginx plugin to automatically configure Nginx
    const cert = await ssh.execCommand('certbot --nginx -d comfortplus0777.com.ua -d www.comfortplus0777.com.ua --non-interactive --agree-tos -m avefan@gmail.com')
    console.log(cert.stdout)
    console.log(cert.stderr)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

runCertbot()
