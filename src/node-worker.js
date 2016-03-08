import { NodeScope } from './lib/modules/NodeScope';

export const node_scope = new NodeScope();
export const worker = self;

worker.onmessage = ({data:{command,value,token}}) => {
  switch (command) {
    case 'eval':
      try {
        const result = node_scope.eval(value);
        worker.postMessage({
          type: 'resolve',
          value: result,
          token
        });
      } catch (e) {
        worker.postMessage({
          type: 'reject',
          token
          // TODO: how to serialize errors?
        });
      }
      break;
    default:
      throw new Error('Unknown command: ' + command);
  }
};
