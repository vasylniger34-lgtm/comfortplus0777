const { NodeSSH } = require('node-ssh')
const ssh = new NodeSSH()

async function checkFiles() {
  try {
    await ssh.connect({
      host: '5.252.155.147',
      username: 'root',
      password: 'os1mw7Xk7U6t3lG5'
    })

    console.log('--- CONTENTS OF /var/www/comfortplus ---')
    const files = await ssh.execCommand('ls -la /var/www/comfortplus')
    console.log(files.stdout)

    console.log('--- PREVIEW index.html ---')
    const index = await ssh.execCommand('head -n 20 /var/www/comfortplus/index.html')
    console.log(index.stdout)

    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

checkFiles()
