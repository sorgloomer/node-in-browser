
function ns(f) {
    return function() {
      throw new Error("Operation " + f + " is not supported.");
    };
}

exports.exec = ns("exec");
