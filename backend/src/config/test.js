const prisma = require('./config/db');

async function test() {
  const users = await prisma.user.findMany();
  console.log(users);
}
test();
