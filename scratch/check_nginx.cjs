const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkConfig() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- NGINX SITES ENABLED ---')
    const sites = await ssh.execCommand('ls -la /etc/nginx/sites-enabled/')
    console.log(sites.stdout)

    console.log('--- COMFORT PLUS CONFIG ---')
    const config = await ssh.execCommand('cat /etc/nginx/sites-available/comfortplus0777.com.ua || echo "Not found"')
    console.log(config.stdout)

    console.log('--- DEFAULT CONFIG ---')
    const defaultConfig = await ssh.execCommand('cat /etc/nginx/sites-available/default || echo "Not found"')
    console.log(defaultConfig.stdout)

    console.log('--- OTHER CONFIGS ---')
    const otherConfigs = await ssh.execCommand('ls -la /etc/nginx/sites-available/')
    console.log(otherConfigs.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkConfig()
