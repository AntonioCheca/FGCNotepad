import React from "react";

import styles from "./FrontendTestingShowcase.module.css";

interface MatrixColumn {
    id: string;
    label: string;
    layer: number;
    summary: number;
}

type MatrixCellKind = "number" | "link" | "dynamic";

interface MatrixCell {
    value: number | string;
    kind: MatrixCellKind;
}

interface MatrixRow {
    id: string;
    label: string;
    layer: number;
    summary: number;
    cells: MatrixCell[];
}

interface SpreadsheetVariantProps {
    className: string;
    tag: string;
    title: string;
    subtitle: string;
    selectedCell: string;
    editingCells: string[];
    contextPanel: "hidden" | "link" | "dynamic";
}

const columns: MatrixColumn[] = [
    {id: "c-1", label: "Stand Guard", layer: 1, summary: 0.24},
    {id: "c-2", label: "Mash 5P", layer: 2, summary: 0.18},
    {id: "c-3", label: "Backdash", layer: 2, summary: 0.31},
    {id: "c-4", label: "Burst", layer: 3, summary: 0.27},
];

const rows: MatrixRow[] = [
    {
        id: "r-1",
        label: "Meaty 2K",
        layer: 1,
        summary: 0.29,
        cells: [
            {value: 620, kind: "number"},
            {value: 380, kind: "number"},
            {value: 140, kind: "number"},
            {value: "Link", kind: "link"},
        ],
    },
    {
        id: "r-2",
        label: "Shimmy Throw",
        layer: 2,
        summary: 0.21,
        cells: [
            {value: 430, kind: "number"},
            {value: 510, kind: "number"},
            {value: 320, kind: "number"},
            {value: "Dyn", kind: "dynamic"},
        ],
    },
    {
        id: "r-3",
        label: "Safejump j.H",
        layer: 2,
        summary: 0.26,
        cells: [
            {value: 720, kind: "number"},
            {value: 210, kind: "number"},
            {value: 410, kind: "number"},
            {value: 80, kind: "number"},
        ],
    },
    {
        id: "r-4",
        label: "Delay Button",
        layer: 3,
        summary: 0.24,
        cells: [
            {value: 280, kind: "number"},
            {value: 460, kind: "number"},
            {value: 540, kind: "number"},
            {value: 160, kind: "number"},
        ],
    },
];

function ContextPanel({mode}: {mode: "hidden" | "link" | "dynamic"}) {
    if (mode === "hidden") {
        return <div className={styles.contextHint}>Cell actions hidden until user enters edit mode on a cell.</div>;
    }

    if (mode === "link") {
        return (
            <aside className={styles.contextPanel}>
                <strong>Scenario Link (visible now)</strong>
                <div className={styles.contextInput}>Search scenarios</div>
                <div className={styles.contextItemActive}>Oki Throw Trap · Mixup · #142</div>
                <div className={styles.contextItem}>Whiff Punish Layer 2 · Neutral · #099</div>
                <div className={styles.contextActions}>
                    <button type="button">Cancel</button>
                    <button type="button">Confirm Link</button>
                </div>
            </aside>
        );
    }

    return (
        <aside className={styles.contextPanel}>
            <strong>Dynamic Combo (visible now)</strong>
            <div className={styles.contextInput}>Attacker: Sol Badguy</div>
            <div className={styles.contextInput}>Starters: 5K, c.S, 2D</div>
            <div className={styles.contextInput}>Context: Counter Hit</div>
            <div className={styles.contextActions}>
                <button type="button">Close</button>
                <button type="button">Save Dynamic Combo</button>
            </div>
        </aside>
    );
}

function SpreadsheetVariant({className, tag, title, subtitle, selectedCell, editingCells, contextPanel}: SpreadsheetVariantProps) {
    return (
        <section className={`${styles.variant} ${className}`}>
            <header className={styles.variantHeader}>
                <div>
                    <p className={styles.variantTag}>{tag}</p>
                    <h2 className={styles.variantTitle}>{title}</h2>
                    <p className={styles.variantSubtitle}>{subtitle}</p>
                </div>
                <div className={styles.metaPills}>
                    <span>Rows 4</span>
                    <span>Cols 4</span>
                    <span>Closed Matrix</span>
                </div>
            </header>

            <div className={styles.toolbarRow}>
                <button type="button">View: Up To Layer</button>
                <button type="button">Layer 2</button>
                <button type="button">Show Layers</button>
                <button type="button" className={styles.primaryButton}>Solve Game</button>
            </div>

            <div className={styles.editingNotice}>
                Context actions are conditional: Link Scenario and Dynamic Combo only appear while editing a compatible cell.
            </div>

            <div className={styles.variantBody}>
                <article className={styles.sheetCard}>
                    <div className={styles.referenceBar}>Reference Inspector: Oki Trap #142 · Resolved 620 · Cached 605</div>
                    <div className={styles.tableWrap}>
                        <table className={styles.matrixTable}>
                            <thead>
                                <tr>
                                    <th>ATK / DEF</th>
                                    {columns.map((column) => (
                                        <th key={column.id}>
                                            <div>{column.label}</div>
                                            <small>L{column.layer}</small>
                                        </th>
                                    ))}
                                    <th>Row Mix</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id}>
                                        <th>
                                            <div>{row.label}</div>
                                            <small>L{row.layer}</small>
                                        </th>
                                        {row.cells.map((cell, index) => {
                                            const key = `${row.id}-${columns[index]?.id}`;
                                            const isSelected = selectedCell === key;
                                            const isEditing = editingCells.includes(key);
                                            return (
                                                <td key={key}>
                                                    <span
                                                        className={[
                                                            styles.cellPill,
                                                            isSelected ? styles.cellSelected : "",
                                                            isEditing ? styles.cellEditing : "",
                                                            cell.kind === "link" ? styles.cellLink : "",
                                                            cell.kind === "dynamic" ? styles.cellDynamic : "",
                                                        ].join(" ")}
                                                    >
                                                        {isEditing ? <input value={String(cell.value)} readOnly /> : cell.value}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                        <td className={styles.summaryCell}>{row.summary.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <th>Col Mix</th>
                                    {columns.map((column) => <td key={`summary-${column.id}`} className={styles.summaryCell}>{column.summary.toFixed(2)}</td>)}
                                    <td className={styles.evCell}>EV 408</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </article>

                <ContextPanel mode={contextPanel} />
            </div>
        </section>
    );
}

export function FrontendTestingShowcase() {
    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <p className={styles.eyebrow}>Frontend matrix testing</p>
                <h1>Control Room Spreadsheet Iterations</h1>
                <p>
                    All variants keep a spreadsheet structure (rows and columns). The contextual link/dynamic panels are now
                    represented as conditional UI that appears only when the selected cell is being edited.
                </p>
            </header>

            <SpreadsheetVariant
                className={styles.variantOne}
                tag="Option 01"
                title="Control Room Baseline"
                subtitle="Closest to your current winner, now explicitly spreadsheet-first."
                selectedCell="r-4-c-2"
                editingCells={["r-2-c-2", "r-3-c-3"]}
                contextPanel="hidden"
            />

            <SpreadsheetVariant
                className={styles.variantTwo}
                tag="Option 02"
                title="Control Room Compact Toolbar"
                subtitle="Denser button treatment and softer badges while preserving table readability."
                selectedCell="r-1-c-3"
                editingCells={["r-1-c-2", "r-4-c-4"]}
                contextPanel="link"
            />

            <SpreadsheetVariant
                className={styles.variantThree}
                tag="Option 03"
                title="Control Room Segmented"
                subtitle="Segmented controls with stronger selected-cell states for faster scanning."
                selectedCell="r-2-c-4"
                editingCells={["r-2-c-4", "r-3-c-2"]}
                contextPanel="dynamic"
            />

            <SpreadsheetVariant
                className={styles.variantFour}
                tag="Option 04"
                title="Control Room Flat Grid"
                subtitle="Minimal chrome around cells and headers, more emphasis on numeric grid density."
                selectedCell="r-3-c-1"
                editingCells={["r-1-c-4", "r-4-c-1"]}
                contextPanel="hidden"
            />

            <SpreadsheetVariant
                className={styles.variantFive}
                tag="Option 05"
                title="Control Room Emphasis"
                subtitle="Higher-contrast highlights for active edits while keeping conditional side actions compact."
                selectedCell="r-1-c-4"
                editingCells={["r-1-c-4", "r-2-c-3"]}
                contextPanel="link"
            />
        </main>
    );
}
