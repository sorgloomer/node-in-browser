const stream = require('stream');
module.exports = function init(process) {
    process.stdin = new stream.Readable();
    process.stdout = ostream(stream, "stdout:");
    process.stderr = ostream(stream, "stderr:");

    function ostream(stream, prefix) {
        var result = new stream.Writable();
        result._write = function (chunk, encoding) {
            console.log(prefix + chunk.toString(encoding || 'utf-8'));
        };
        return result;
    }
};