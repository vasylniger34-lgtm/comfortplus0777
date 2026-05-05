const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkConfig() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- COMFORT PLUS CONFIG (/etc/nginx/sites-available/comfortplus) ---')
    const config = await ssh.execCommand('cat /etc/nginx/sites-available/comfortplus')
    console.log(config.stdout)

    console.log('--- CAPYCODE CONFIG ---')
    const capy = await ssh.execCommand('cat /etc/nginx/sites-available/capycode')
    console.log(capy.stdout)

    console.log('--- WIRECODE CONFIG ---')
    const wire = await ssh.execCommand('cat /etc/nginx/sites-available/wirecode')
    console.log(wire.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkConfig()
