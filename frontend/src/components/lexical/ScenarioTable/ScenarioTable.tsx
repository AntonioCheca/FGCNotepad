import React from 'react';
import { NumberField } from '@base-ui-components/react/number-field';
import EditableTextCell from "@/src/components/lexical/EditableTextCell";
import { AppAddIconButton } from "@/src/components/ui/AppAddIconButton";
import { AppRemoveIconButton } from "@/src/components/ui/AppRemoveIconButton";
import { AppTableCell } from "@/src/components/ui/AppTableCell";
import { AppLeftArrowButton } from "@/src/components/ui/AppLeftArrowButton";
import { AppRightArrowButton } from "@/src/components/ui/AppRightArrowButton";
import { AppUpArrowButton } from "@/src/components/ui/AppUpArrowButton";
import { AppDownArrowButton } from "@/src/components/ui/AppDownArrowButton";
import { AppPaper } from "@/src/components/ui/AppPaper";
import { AppTableFooter } from "@/src/components/ui/AppTableFooter";
import { AppTableRow } from "@/src/components/ui/AppTableRow";
import { AppTableHead } from "@/src/components/ui/AppTableHead";
import { AppTableContainer } from "@/src/components/ui/AppTableContainer";
import { AppTable } from "@/src/components/ui/AppTable";
import { AppTableBody } from "@/src/components/ui/AppTableBody";
import { ScenarioTableState } from '@/hooks/useScenarioTableState';
import { ScenarioTableService } from '@/services/ScenarioTableService';
import { styled } from '@mui/material/styles';

interface ScenarioTableProps {
    state: ScenarioTableState;
    tableService: ScenarioTableService;
}

const StyledTableContainer = styled(AppTableContainer)(({ theme }) => ({
    '& .MuiTable-root': {
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        '& .frozen-first-column': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: 'white',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        },
        '& .frozen-corner-cell': {
            position: 'sticky',
            left: 0,
            top: 0,
            zIndex: 15,
            backgroundColor: '#f5f5f5',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        },
        '& .frozen-frequency-cell': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: '#f0f0f0',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        },
        '& .frozen-footer-cell': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: 'white',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        },
        // Add this to fix the small width of frozen-last-column
        '& .frozen-last-column': {
            position: 'sticky',
            right: 0,
            zIndex: 5,
            backgroundColor: 'white',
            boxShadow: '-2px 0 4px rgba(0,0,0,0.1)',
            width: '140px',
            minWidth: '140px',
            maxWidth: '140px',
            whiteSpace: 'nowrap',
        },
        '& .frozen-last-row': {
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            backgroundColor: '#f0f0f0',
            boxShadow: '0 -2px 4px rgba(0,0,0,0.1)',
        },
    },
}));

export function ScenarioTable({ state, tableService }: ScenarioTableProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const topScrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleScroll = () => {
            if (topScrollRef.current && scrollRef.current) {
                topScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
            }
        };
        const scrollDiv = scrollRef.current;
        scrollDiv?.addEventListener("scroll", handleScroll);
        return () => scrollDiv?.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <div
                style={{
                    overflowX: 'auto',
                    height: '16px',
                    position: 'sticky',
                    top: 0,
                    background: '#fff',
                    zIndex: 20
                }}
                ref={topScrollRef}
            >
                <div style={{ width: scrollRef.current?.scrollWidth || '2000px' }} />
            </div>
            <StyledTableContainer
                onScroll={() => {
                    if (scrollRef.current && topScrollRef.current) {
                        topScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
                    }
                }}
                ref={scrollRef}
                component={AppPaper}
                elevation={3}
                sx={{
                    maxWidth: "95%",
                    maxHeight: "60vh",
                    overflow: "auto",
                    borderRadius: 2,
                    marginRight: '10px',
                    marginBottom: '10px'
                }}
                className="table-container"
                display='inline-block'
            >
                <AppTable>
                    <TableHeader
                        columns={state.columns}
                        addColumn={() => tableService.addColumn()}
                        removeColumn={(colIndex) => tableService.removeColumn(colIndex)}
                        setColumns={(columns) => tableService.actions.setAndUpdateColumns(columns)} />
                    <AppTableBody>
                        {state.rows.map((row, rowIndex) => (
                            <TableRowComponent
                                key={rowIndex}
                                row={row}
                                rows={state.rows}
                                rowIndex={rowIndex}
                                columns={state.columns}
                                values={state.values}
                                handleValueChange={(rowIndex, colIndex, newValue) => tableService.updateValue(rowIndex, colIndex, newValue)}
                                setRows={(rows) => tableService.actions.setAndUpdateRows(rows)}
                                removeRow={(rowIndex) => tableService.removeRow(rowIndex)}
                                moveRowDown={(rowIndex) => tableService.moveRowDown(rowIndex)}
                                moveRowUp={(rowIndex) => tableService.moveRowUp(rowIndex)}
                                rowFrequency={state.rowFrequencies[rowIndex]}
                                onRowFrequencyChange={(newValue) => tableService.updateRowFrequency(rowIndex, newValue)} />
                        ))}
                    </AppTableBody>
                    <AppTableFooter>
                        <FrequencyRow
                            columns={state.columns}
                            columnFrequencies={state.columnFrequencies}
                            handleColumnFrequencyChange={(colIndex, newValue) => tableService.updateColumnFrequency(colIndex, newValue)}
                            expectedValue={tableService.calculateExpectedValue()} />
                    </AppTableFooter>
                    <TableFooterComponent
                        addRow={() => tableService.addRow()}
                        removeRow={() => { }}
                        columns={state.columns}
                        moveColumnLeft={(colIndex) => tableService.moveColumnLeft(colIndex)}
                        moveColumnRight={(colIndex) => tableService.moveColumnRight(colIndex)}
                        removeColumn={(colIndex) => tableService.removeColumn(colIndex)} />
                </AppTable>
            </StyledTableContainer>
        </>
    );
}

function FrequencyRow({ columns, columnFrequencies, handleColumnFrequencyChange, expectedValue }) {
    return (
        <AppTableRow className="frozen-last-row" sx={{ backgroundColor: "#f0f0f0" }} component="tr">
            <AppTableCell className="frozen-frequency-cell" sx={{ fontWeight: "bold" }}>
                P2 Frequencies
            </AppTableCell>
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{ textAlign: "center" }}>
                    <NumberField.Root>
                        <NumberField.Input
                            value={columnFrequencies[colIndex]}
                            onChange={(e) => handleColumnFrequencyChange(colIndex, e.target.value)}
                            size="small"
                            sx={{ width: "60px" }}
                            inputProps={{ min: 0, max: 1, step: 0.01 }}
                        />
                    </NumberField.Root>
                </AppTableCell>
            ))}
            <AppTableCell className="frozen-last-column" sx={{ textAlign: "center", fontWeight: "bold" }}>
                EV: {expectedValue}
            </AppTableCell>
        </AppTableRow>
    );
}

function TableHeader({ columns, addColumn, removeColumn, setColumns }) {
    const handleColumnNameChange = (colIndex, newName) => {
        const updatedColumns = [...columns];
        updatedColumns[colIndex] = newName;
        setColumns(updatedColumns);
    };

    return (
        <AppTableHead>
            <AppTableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <AppTableCell className="frozen-corner-cell" sx={{ fontWeight: "bold" }}>
                    Moves (P1 \ P2)
                </AppTableCell>
                {columns.map((col, colIndex) => (
                    <EditableTextCell
                        key={colIndex}
                        value={col}
                        onChange={(newValue) => handleColumnNameChange(colIndex, newValue)}
                        sx={{ textAlign: "center", fontWeight: "bold" }}
                    />
                ))}
                <AppTableCell sx={{ textAlign: "center" }}>
                    <AppAddIconButton onClick={addColumn} size="small" />
                </AppTableCell>
                <AppTableCell className="frozen-last-column" />
                <AppTableCell className="frozen-last-column" />
            </AppTableRow>
        </AppTableHead>
    );
}

function TableRowComponent({ row, rows, rowIndex, columns, values, handleValueChange, setRows, moveRowUp, moveRowDown, rowFrequency, onRowFrequencyChange, removeRow }) {
    const handleRowNameChange = (newName) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex] = newName;
        setRows(updatedRows);
    };

    return (
        <AppTableRow sx={{ backgroundColor: rowIndex % 2 ? "#fafafa" : "inherit" }}>
            <AppTableCell className="frozen-first-column" sx={{ fontWeight: "bold" }}>
                <EditableTextCell value={row} onChange={handleRowNameChange} />
            </AppTableCell>
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{ textAlign: "center" }}>
                    <NumberInputField
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        value={values[rowIndex][colIndex]}
                        onValueChange={(newValue) => handleValueChange(rowIndex, colIndex, newValue)}
                    />
                </AppTableCell>
            ))}
            <AppTableCell className="frozen-last-column" sx={{ textAlign: "center" }}>
                <NumberField.Root>
                    <NumberField.Input
                        value={rowFrequency}
                        onChange={(e) => onRowFrequencyChange(e.target.value)}
                        size="small"
                        sx={{ width: "60px" }}
                        inputProps={{ min: 0, max: 1, step: 0.01 }}
                    />
                </NumberField.Root>
            </AppTableCell>
            <AppTableCell className="frozen-last-column" sx={{ textAlign: "center" }}>
                <AppUpArrowButton size="small" onClick={() => moveRowUp(rowIndex)} />
                <AppRemoveIconButton size="small" onClick={() => removeRow(rowIndex)} />
                <AppDownArrowButton size="small" onClick={() => moveRowDown(rowIndex)} />
            </AppTableCell>
        </AppTableRow>
    );
}

function TableFooterComponent({ addRow, removeRow, columns, moveColumnLeft, moveColumnRight, removeColumn }) {
    return (
        <AppTableFooter>
            <AppTableRow className="frozen-last-row">
                <AppTableCell className="frozen-footer-cell">
                    <AppAddIconButton onClick={addRow} size="small" />
                    <AppRemoveIconButton onClick={removeRow} size="small" />
                </AppTableCell>
                {columns.map((_, colIndex) => (
                    <AppTableCell key={colIndex} sx={{ textAlign: "center" }}>
                        <AppLeftArrowButton onClick={() => moveColumnLeft(colIndex)} size="small" />
                        <AppRemoveIconButton onClick={() => removeColumn(colIndex)} size="small" />
                        <AppRightArrowButton onClick={() => moveColumnRight(colIndex)} size="small" />
                    </AppTableCell>
                ))}
                <AppTableCell className="frozen-last-column" />
                <AppTableCell className="frozen-last-column" sx={{ textAlign: 'center' }}>
                </AppTableCell>
            </AppTableRow>
        </AppTableFooter>
    );
}


function NumberInputField({ rowIndex, colIndex, value, onValueChange }) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const refMatrix = React.useRef<HTMLInputElement[][]>([]);

    React.useEffect(() => {
        if (!refMatrix.current[rowIndex]) {
            refMatrix.current[rowIndex] = [];
        }
        refMatrix.current[rowIndex][colIndex] = inputRef.current!;
    }, [rowIndex, colIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        let target: HTMLInputElement | undefined;
        switch (e.key) {
            case 'ArrowRight':
                target = refMatrix.current[rowIndex]?.[colIndex + 1];
                break;
            case 'ArrowLeft':
                target = refMatrix.current[rowIndex]?.[colIndex - 1];
                break;
            case 'ArrowDown':
                target = refMatrix.current[rowIndex + 1]?.[colIndex];
                break;
            case 'ArrowUp':
                target = refMatrix.current[rowIndex - 1]?.[colIndex];
                break;
        }

        if (target) {
            e.preventDefault();
            target.focus();
        }
    };

    return (
        <NumberField.Root>
            <NumberField.Input
                inputRef={inputRef}
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                onKeyDown={handleKeyDown}
                size="small"
                sx={{ width: "60px" }}
                tabIndex={0}
            />
        </NumberField.Root>
    );
}
