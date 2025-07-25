import Docker from 'dockerode';
async function test() {
    const docker = new Docker();
    const port = 9877;
    const image = 'postgres:17'
    const container = await docker.createContainer({
        Image: image,
        Cmd: ['postgres', '-c', 'shared_preload_libraries=pg_stat_statements'],
        Env: ['POSTGRES_USER=test', 'POSTGRES_PASSWORD=test', 'POSTGRES_DB=testdb'],
        ExposedPorts: { '5432/tcp': {} },
        HostConfig: { PortBindings: { '5432/tcp': [{ HostPort: port.toString() }] } }
    });

    try {
        await container.start();
    } catch (error: any) {
        console.error('container error', error);
        throw error;
    }

    console.log(`Postgres container started with image ${image} on port ${port}`);
}
test();