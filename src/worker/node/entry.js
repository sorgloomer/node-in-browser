
import node_env from "./node-env";

// Hack to make shitty implementations relying on window work....
self.window = self;

const worker = self;

var container = node_env();
const commands = commandify();
subscribe(commands);

function commandify() {
    return {
        eval(value) {
            return container.eval(value)
        },
        eval_lines(value) {
            return container.eval_lines(value)
        },
        ping() {
            return 'pong'
        },
        reset() {
            container = node_env();
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
            worker.postMessage({
                type: 'reject', token, value: '' + e
            });
            throw e;
        }
    };
}