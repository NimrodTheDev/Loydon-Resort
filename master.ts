const cluster = require('cluster')

cluster.setupMaster({
    exec: __dirname + '/index.ts'
})

cluster.fork()
cluster.fork()

cluster.on("disconnect", (worker: any) => {
    console.log(`Worker ${worker.process.pid} disconnected`)
}).on("exit", (worker: any) => {
    console.log(`Worker ${worker.process.pid} exited`)
    cluster.fork()
}).on("listening", (worker: any) => {
    console.log(`Worker ${worker.process.pid} is listening`)
})