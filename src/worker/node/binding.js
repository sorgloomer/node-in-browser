
import * as Path from "../vfs/path";

export default function make_binding(vfs, exe, cwd) {
    binding.path = Path;
    binding.vfs = vfs;
    binding.cwd = cwd;
    binding.executable = exe;
    return binding;

    function binding() {
        return {};
    }
}
