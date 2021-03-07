# Signal-Fire Server CLI

Command-Line Interface (CLI) for [Signal-Fire Server](https://github.com/Signal-Fire/server).

__Signal-Fire Server__ is a __WebRTC__ signaling server built for node.js.

A WebRTC signaling server communicates between peers to set up
peer-to-peer audio/video and/or data channels. This allows your
clients to communicate directly with each other.

## Features

* Run multiple instances of [Signal-Fire Server](https://github.com/Signal-Fire/server)
* Start background workers
* Easy configuration and set-up

## Install

Install globally:

```
npm i -g @signal-fire/cli
```

## Usage

```
Usage: signal-fire [options] [command]

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  start [options]       start a new worker
  stop <pid>            stop worker with the given pid
  info [options] <pid>  list info for worker
  list [options]        list all active workers
  help [command]        display help for command
```

### Start

```
Usage: signal-fire start [options]

start a new worker

Options:
  -c, --config <file>  path to configuration file
  -p, --port <port>    port to listen on
  -h, --host <host>    host to listen on
  -P, --path <path>    path to listen on
  --help               display help for command
```

#### Configuration file

```ts
interface WorkerConfiguration {
  /**
   * Registry to use. Defaults to 'local' 
   **/
  registry?: string | {
    name: string,
    args?: any[]
  },
  /**
   * Options for the API server.
   * If false, the API server is disabled.
   * If a number, this will be the port
   * Otherwise the object is passed to Server.listen()
   **/
  api?: boolean | number | {
    host?: string,
    port: string,
    ipv6Only?: boolean
  },
  /**
   * Options fot the app server.
   * If not set, defaults to a random open port
   * If a number, this will be the port
   * If set, the object is passed to Server.listen()
   **/
  app?: number | {
    host?: string,
    port: number,
    ipv6Only?: boolean,
    /**
     * The path to listen for upgrades on.
     * All other requests receive 404 Not Found,
     * a regular HTTP call received 426 Upgrade Required
     **/
    pathname?: string
  },
  /**
   * WebRTC client configuration.
   * These options are passed to all new clients.
   **/
  rtcConfig?: {
    bundlePolicy?: RTCBundlePolicy,
    iceCandidatePoolSize?: number,
    iceServers: RTCIceServer[],
    iceTransportPolicy: RTCIceTransportPolicy,
    rtcpMuxPolicy?: RTCRtcpMuxPolicy
  }
}
```

Example configuration file:

```json
{
  "registry": "local",
  "server": {
    "port": 3303,
    "pathname": "/socket"
  },
  "api": true,
  "rtcConfig": {
    "iceServers": [{
      "urls": "ice.example.com"
    }]
  }
}
```

### Stop

Use `stop all` to stop all running workers.

```
Usage: signal-fire stop [options] <pid>

stop worker with the given pid

Options:
  -h, --help  display help for command
```

### List

```
Usage: signal-fire list [options]

list all active workers

Options:
  -t, --token  include api token in output (default: false)
  -j, --json   output json
  -h, --help   display help for command
```

### Info

```
Usage: signal-fire info [options] <pid>

list info for worker

Options:
  -t, --token  include api token in output (default: false)
  -j, --json   output json
  -h, --help   display help for command
```

## License

Copyright 2021 Michiel van der Velde.

This software is licensed under [the MIT License](LICENSE).
