const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function catAll() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    const files = ['comfortplus', 'capycode', 'wirecode', 'default']
    for (const f of files) {
      console.log(`--- ${f} ---`)
      const content = await ssh.execCommand(`cat /etc/nginx/sites-available/${f}`)
      console.log(content.stdout)
    }

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

catAll()
