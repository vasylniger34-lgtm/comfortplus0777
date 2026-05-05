const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkConfig() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- DEFAULT CONFIG CONTENT ---')
    const defaultConfig = await ssh.execCommand('cat /etc/nginx/sites-available/default')
    console.log(defaultConfig.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkConfig()
