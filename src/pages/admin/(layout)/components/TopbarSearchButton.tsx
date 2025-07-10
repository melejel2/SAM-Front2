export const TopbarSearchButton = () => {
    return (
        <>
            <button
                className="btn btn-outline btn-sm btn-ghost border-base-300 text-base-content/70 hidden h-9 w-48 justify-start gap-2 !text-sm md:flex"
                onClick={() => document.querySelector<HTMLDialogElement>("#topbar-search-modal")?.showModal()}>
                <span className="iconify lucide--search size-4" />
                <span>Search</span>
            </button>
            <button
                className="btn btn-outline btn-sm btn-square btn-ghost border-base-300 text-base-content/70 flex size-9 md:hidden"
                aria-label="Search"
                onClick={() => document.querySelector<HTMLDialogElement>("#topbar-search-modal")?.showModal()}>
                <span className="iconify lucide--search size-4" />
            </button>
            <dialog id="topbar-search-modal" className="modal p-0">
                <div className="modal-box p-0">
                    <div className="p-4 border-b border-base-300">
                        <div className="flex justify-center">
                            <div className="relative group max-w-md w-full">
                                {/* Search Icon */}
                                <div className="absolute inset-y-0 left-0 flex items-center justify-center pl-4 pointer-events-none z-10">
                                    <span className="iconify lucide--search h-5 w-5 text-base-content/50" />
                                </div>
                                
                                {/* Search Input - Integrated Design */}
                                <input
                                    type="search"
                                    className="input w-full pl-12 pr-13 bg-base-200 text-base-content border border-base-300 focus:border-base-300 focus:bg-base-200 transition-all duration-200 rounded-full placeholder:text-base-content/50 hover:border-primary/50 text-sm focus:outline-none"
                                    placeholder="Search"
                                    aria-label="Search"
                                />
                                
                                {/* Close Button */}
                                <form method="dialog" className="absolute inset-y-0 right-0 flex items-center justify-center pr-3 z-10">
                                    <button className="btn btn-sm btn-circle btn-ghost text-base-content/40 hover:text-error transition-colors duration-200" aria-label="Close">
                                        <span className="iconify lucide--x h-4 w-4" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                    <ul className="menu w-full pt-0">
                        <li className="menu-title">Actions</li>
                        <li>
                            <div>
                                <span className="iconify lucide--folder-plus size-4.5" />
                                <p className="grow text-sm">Create a new folder</p>
                            </div>
                        </li>
                        <li>
                            <div>
                                <span className="iconify lucide--file-plus size-4.5" />
                                <p className="grow text-sm">Upload new document</p>
                            </div>
                        </li>
                        <li>
                            <div>
                                <span className="iconify lucide--user-plus size-4.5" />
                                <p className="grow text-sm">Invite to project</p>
                            </div>
                        </li>
                    </ul>
                    <hr className="border-base-300 h-px" />
                    <ul className="menu w-full pt-0">
                        <li className="menu-title">Quick Links</li>
                        <li>
                            <div>
                                <span className="iconify lucide--folders size-4.5" />
                                <p className="grow text-sm">File Manager</p>
                            </div>
                        </li>

                        <li>
                            <div>
                                <span className="iconify lucide--user size-4.5" />
                                <p className="grow text-sm">Profile</p>
                            </div>
                        </li>
                        <li>
                            <div>
                                <span className="iconify lucide--layout-dashboard size-4.5" />
                                <p className="grow text-sm">Dashboard</p>
                            </div>
                        </li>

                        <li>
                            <div>
                                <span className="iconify lucide--help-circle size-4.5" />
                                <p className="grow text-sm">Support</p>
                            </div>
                        </li>

                        <li>
                            <div>
                                <span className="iconify lucide--keyboard size-4.5" />
                                <p className="grow text-sm">Keyboard Shortcuts</p>
                            </div>
                        </li>
                    </ul>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
};
