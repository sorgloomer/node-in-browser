
function ns(f) {
    return function() {
      throw new Error("Operation " + f + " is not supported.");
    };
}
export default {
    exec: ns("exec")
};