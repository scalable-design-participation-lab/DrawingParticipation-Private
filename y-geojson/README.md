# y-geojson
## A package to sync geojson features with Yjs

## Install
### Install requirement
```bash
npm install yjs
# install your provider (e.g. y-websocket)
```
### Install package
```bash
npm install y-geojson
```

## Example Usage
```typescript
// connect to your provider (y-websocket in this example)
const { doc } = useYGeoJson()
const provider = new WebsocketProvider('serverPath', 'publicRoom', doc)
```

## Development
* When installing this package as a local dependency, make sure `node_modules` is removed or deleted
  * Fail to do so will cause this [issue](https://github.com/yjs/yjs/issues/438) to happen
  * You can also use `npm pack` to create a tarball and install it instead of deleting `node_modules`
