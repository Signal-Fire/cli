# Signal-Fire Server CLI

CLI for [Signal-Fire Server](https://github.com/Signal-Fire/server).

Signal-Fire Server is a __WebRTC__ signaling server built for node.js.

## Features

* Run multiple instances of [Signal-Fire Server](https://github.com/Signal-Fire/server)
* Start background workers
* Easy configuration and set-up

## Install

> This project is currently a __work in progress__!

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
  -p, --port <port>    port to listen on
  -c, --config <file>  path to configuration file
  -h, --host <host>    host to listen on
  -P, --path <path>    path to listen on
  --help               display help for command
```

### Configuration file

```ts
interface Configuration {
  registry: 'local' | {
    name: string,
    args?: any[]
  },
  server: {
    port?: number
    host?: string
    backlog?: number
    path?: string
    exclusive?: boolean
    readableAll?: boolean
    writableAll?: boolean
    ipv6Only?: boolean
  },
  rtcConfig?: {
    bundlePolicy?: RTCBundlePolicy
    certificates?: RTCCertificate[]
    iceCandidatePoolSize?: number
    iceServers?: RTCIceServer[]
    iceTransportPolicy?: RTCIceTransportPolicy
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
    "path": "/socket"
  },
  "rtcConfig": {
    "iceServers": {
      "urls": "ice.example.com"
    }
  }
}
```

## Stop

```
Usage: signal-fire stop [options] <pid>

stop worker with the given pid

Options:
  -h, --help  display help for command
```

## List

```
Usage: signal-fire list [options]

list all active workers

Options:
  -t, --token  include api token in output (default: false)
  -h, --help   display help for command
```

### Info

```
Usage: signal-fire info [options] <pid>

list info for worker

Options:
  -t, --token  include api token in output (default: false)
  -h, --help   display help for command
```

## License

Copyright 2021 Michiel van der Velde.

This software is licensed under [the MIT License](LICENSE).
