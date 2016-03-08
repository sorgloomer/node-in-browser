
// Hack to make shitty implementations relying on window work....
self.window = self;

const worker = self;
const NodeContainer = require('./node-container.js');

const container = new NodeContainer();
const commands = commandify(container);
subscribe(commands);

function commandify(container) {
    return {
        eval(value) {
            return container.eval(value)
        },
        eval_lines(value) {
            return container.eval_lines(value)
        },
        ping() {
            return 'pong'
        }
    };
}

function subscribe(commands) {
    worker.onmessage = ({data:{type,token,value}}) => {
        try {
            const res = commands[type](value);
            worker.postMessage({
                type: 'resolve', token, value: res
            });
        } catch (e) {
            console.error(e);
            worker.postMessage({
                type: 'reject', token, value: '' + e
            });
        }
    };
}