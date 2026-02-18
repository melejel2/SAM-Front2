import { useVersionCheck } from "@/hooks/use-version-check";

/** Invisible component that runs version-check polling inside the router context. */
export function VersionChecker() {
    useVersionCheck();
    return null;
}
