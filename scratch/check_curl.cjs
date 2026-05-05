const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkLocalhost() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- CURL LOCALHOST (Port 80) ---')
    // We expect a 301 to https now due to Certbot
    const curl = await ssh.execCommand('curl -I http://localhost')
    console.log(curl.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkLocalhost()
