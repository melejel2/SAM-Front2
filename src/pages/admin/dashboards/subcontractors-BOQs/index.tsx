import { memo, useCallback, useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Loader } from "@/components/Loader";
import SAMTable from "@/components/Table";

import useSubcontractorsBOQs from "./use-subcontractors-boqs";

// Lazy load TerminatedContracts to reduce initial bundle size
const TerminatedContracts = lazy(() => import("./TerminatedContracts"));


const SubcontractorsBOQs = memo(() => {
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(() => {
        const stored = sessionStorage.getItem("sub-boqs-tab");
        return stored ? Number(stored) : 0;
    });
    const [selectedProject, setSelectedProject] = useState<string>(() => sessionStorage.getItem("sub-boqs-project") || "All Projects");
    // Track if terminated contracts tab has been loaded (lazy loading)
    const [terminatedTabLoaded, setTerminatedTabLoaded] = useState(false);

    const {
        columns,
        tableData: activeContractsData,
        inputFields,
        loading,
        getContractsDatasets
    } = useSubcontractorsBOQs();

    useEffect(() => {
        getContractsDatasets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => { sessionStorage.setItem("sub-boqs-tab", String(activeTab)); }, [activeTab]);
    useEffect(() => { sessionStorage.setItem("sub-boqs-project", selectedProject); }, [selectedProject]);

    const handleViewContractDetails = useCallback((row: any) => {
        // Navigate to contract details page using contract number (user-friendly) instead of ID
        const contractNumber = row.contractNumber || row.id; // Fallback to ID if no contract number
        navigate(`/dashboard/contracts/details/${contractNumber}`, {
            state: {
                contractId: row.id, // Keep actual ID for API calls
                contractNumber: row.contractNumber,
                projectName: row.projectName,
                subcontractorName: row.subcontractorName,
                tradeName: row.tradeName,
                amount: row.amount,
                contractDate: row.contractDate,
                completionDate: row.completionDate,
                status: row.status
            }
        });
    }, [navigate]);

    const handleBackToDashboard = useCallback(() => {
        navigate('/dashboard');
    }, [navigate]);

    // Memoize unique projects for filter dropdown (prevents recalculation on every render)
    const uniqueProjects = useMemo(() => {
        return Array.from(new Set(activeContractsData.map((contract: any) => contract.projectName).filter(name => name && name !== '-'))).sort();
    }, [activeContractsData]);

    // Memoize filtered contracts data
    const filteredContractsData = useMemo(() => {
        return selectedProject === "All Projects"
            ? activeContractsData
            : activeContractsData.filter((contract: any) => contract.projectName === selectedProject);
    }, [selectedProject, activeContractsData]);

    // When switching to terminated tab, mark it as loaded for lazy loading
    useEffect(() => {
        if (activeTab === 1 && !terminatedTabLoaded) {
            setTerminatedTabLoaded(true);
        }
    }, [activeTab, terminatedTabLoaded]);


    return (
        <div style={{
            height: 'calc(100vh - 4rem)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Fixed Header Section */}
            <div style={{ flexShrink: 0 }} className="pb-3">
                {/* Header with Back Button */}
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBackToDashboard}
                            className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                        >
                            <span className="iconify lucide--arrow-left size-4"></span>
                            <span>Back</span>
                        </button>

                        {/* Project Filter Dropdown */}
                        <div className="dropdown">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn btn-sm border border-base-300 bg-base-100 text-base-content hover:bg-base-200 flex items-center gap-2"
                            >
                                <span className="iconify lucide--filter size-4"></span>
                                <span>{selectedProject}</span>
                                <span className="iconify lucide--chevron-down size-3.5"></span>
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-64 mt-1 max-h-96 overflow-y-auto">
                                <li>
                                    <button
                                        onClick={() => setSelectedProject("All Projects")}
                                        className={`flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                            selectedProject === "All Projects" ? "bg-base-200 font-semibold" : ""
                                        }`}
                                    >
                                        <span className="iconify lucide--list size-4"></span>
                                        <span>All Projects ({activeContractsData.length})</span>
                                    </button>
                                </li>
                                <li className="menu-title">
                                    <span className="text-xs font-semibold">Projects</span>
                                </li>
                                {uniqueProjects.map((projectName) => {
                                    const count = activeContractsData.filter((contract: any) => contract.projectName === projectName).length;
                                    return (
                                        <li key={String(projectName)}>
                                            <button
                                                onClick={() => setSelectedProject(projectName as string)}
                                                className={`flex items-center gap-2 p-2 hover:bg-base-200 rounded transition-colors duration-200 ${
                                                    selectedProject === projectName ? "bg-base-200 font-semibold" : ""
                                                }`}
                                            >
                                                <span className="iconify lucide--folder size-4"></span>
                                                <span className="truncate flex-1">{projectName}</span>
                                                <span className="badge badge-sm badge-ghost">{count}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="btn btn-sm btn-primary text-white flex items-center gap-2"
                            onClick={() => navigate('/dashboard/contracts/new')}
                        >
                            <span className="iconify lucide--plus size-4"></span>
                            <span>New Subcontract</span>
                        </button>
                    </div>
                </div>

                {/* Category Selection Cards */}
                <div className="flex items-center gap-2 mb-0">
                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeTab === 0
                                ? "btn-primary"
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => setActiveTab(0)}
                    >
                        <span className="iconify lucide--file-text size-4" />
                        <span>Active Contracts ({filteredContractsData.length})</span>
                    </button>

                    <button
                        className={`btn btn-sm transition-all duration-200 hover:shadow-md ${
                            activeTab === 1
                                ? "btn-primary"
                                : "btn-ghost border border-base-300 hover:border-primary/50"
                        }`}
                        onClick={() => setActiveTab(1)}
                    >
                        <span className="iconify lucide--x-circle size-4" />
                        <span>Terminated Contracts</span>
                    </button>
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {loading ? (
                    <Loader
                        icon="file-spreadsheet"
                        subtitle="Loading: Contracts"
                        description="Preparing contract data..."
                    />
                ) : (
                    activeTab === 0 ? (
                        <SAMTable
                            columns={columns}
                            tableData={filteredContractsData}
                            actions
                            previewAction
                            title={"Subcontractor BOQ"}
                            loading={false}
                            onSuccess={getContractsDatasets}
                            openStaticDialog={(type, data) => {
                                if (type === "Preview" && data) {
                                    return handleViewContractDetails(data);
                                }
                            }}
                            dynamicDialog={false}
                            virtualized={true}
                            rowHeight={40}
                            overscan={5}
                        />
                    ) : (
                        // Only render TerminatedContracts when tab is active (lazy loading)
                        terminatedTabLoaded && (
                            <Suspense fallback={<Loader icon="x-circle" subtitle="Loading: Terminated Contracts" />}>
                                <TerminatedContracts selectedProject={selectedProject} />
                            </Suspense>
                        )
                    )
                )}
            </div>
        </div>
    );
});

SubcontractorsBOQs.displayName = 'SubcontractorsBOQs';

export default SubcontractorsBOQs;

