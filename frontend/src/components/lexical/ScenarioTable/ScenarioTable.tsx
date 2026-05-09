import React from 'react';
import {NumberField} from '@base-ui-components/react/number-field';
import EditableTextCell from "@/src/components/lexical/EditableTextCell";
import {AppAddIconButton} from "@/src/components/ui/AppAddIconButton";
import {AppRemoveIconButton} from "@/src/components/ui/AppRemoveIconButton";
import {AppTableCell} from "@/src/components/ui/AppTableCell";
import {AppLeftArrowButton} from "@/src/components/ui/AppLeftArrowButton";
import {AppRightArrowButton} from "@/src/components/ui/AppRightArrowButton";
import {AppUpArrowButton} from "@/src/components/ui/AppUpArrowButton";
import {AppDownArrowButton} from "@/src/components/ui/AppDownArrowButton";
import {AppPaper} from "@/src/components/ui/AppPaper";
import {AppTableFooter} from "@/src/components/ui/AppTableFooter";
import {AppTableRow} from "@/src/components/ui/AppTableRow";
import {AppTableHead} from "@/src/components/ui/AppTableHead";
import {AppTableContainer} from "@/src/components/ui/AppTableContainer";
import {AppTable} from "@/src/components/ui/AppTable";
import {AppTableBody} from "@/src/components/ui/AppTableBody";
import {ScenarioTableState, type ScenarioTableValue} from '@/hooks/useScenarioTableState';
import {ScenarioTableService} from '@/services/ScenarioTableService';
import {styled} from '@/src/components/ui/AppStyled';
import {useMode} from '@/src/context/ThemeContext';

interface ScenarioTableProps {
    state: ScenarioTableState;
    tableService: ScenarioTableService;
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
}

interface FrequencyRowProps {
    defenderCharacterName?: string | null;
    columns: string[];
    columnFrequencies: (number | string)[];
    handleColumnFrequencyChange: (colIndex: number, newValue: string) => void;
    expectedValue: number | string;
}

interface TableHeaderProps {
    attackerCharacterName?: string | null;
    defenderCharacterName?: string | null;
    columns: string[];
    addColumn: () => void;
    setColumns: (columns: string[]) => void;
}

interface TableRowComponentProps {
    row: string;
    rows: string[];
    rowIndex: number;
    columns: string[];
    values: ScenarioTableValue[][];
    handleValueChange: (rowIndex: number, colIndex: number, newValue: string) => void;
    setRows: (rows: string[]) => void;
    moveRowUp: (rowIndex: number) => void;
    moveRowDown: (rowIndex: number) => void;
    rowFrequency: number | string;
    onRowFrequencyChange: (newValue: string) => void;
    removeRow: (rowIndex: number) => void;
}

interface TableFooterComponentProps {
    addRow: () => void;
    removeRow: () => void;
    columns: string[];
    moveColumnLeft: (colIndex: number) => void;
    moveColumnRight: (colIndex: number) => void;
    removeColumn: (colIndex: number) => void;
}

interface NumberInputFieldProps {
    rowIndex: number;
    colIndex: number;
    value: number | string;
    onValueChange: (newValue: string) => void;
}

const StyledTableContainer = styled(AppTableContainer)(({theme}) => ({
    '& .MuiTable-root': {
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `0 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
        '& .frozen-first-column': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `2px 0 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            minWidth: 'max-content',
        },
        '& .frozen-corner-cell': {
            position: 'sticky',
            left: 0,
            top: 0,
            zIndex: 15,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f5f5f5',
            boxShadow: `2px 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            minWidth: 'max-content',
        },
        '& .frozen-frequency-cell': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f0f0f0',
            boxShadow: `2px 0 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            minWidth: 'max-content',
        },
        '& .frozen-footer-cell': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `2px 0 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            minWidth: 'max-content',
        },
        '& .frozen-last-column': {
            position: 'sticky',
            right: 0,
            zIndex: 5,
            backgroundColor: theme.palette.background.paper,
            boxShadow: `-2px 0 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            width: '140px',
            minWidth: '140px',
            maxWidth: '140px',
            whiteSpace: 'nowrap',
        },
        '& .frozen-last-row': {
            position: 'sticky',
            bottom: 0,
            zIndex: 10,
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '#f0f0f0',
            boxShadow: `0 -2px 4px ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        },
    },
}));

function toNumberFieldValue(value: number | string): number | null {
    if (typeof value === 'number') {
        return value;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function ScenarioTable({state, tableService, attackerCharacterName, defenderCharacterName}: ScenarioTableProps) {
    const {theme} = useMode();
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const topScrollRef = React.useRef<HTMLDivElement>(null);

    const effectiveAttackerName = attackerCharacterName ?? state.attackerCharacterName ?? null;
    const effectiveDefenderName = defenderCharacterName ?? state.defenderCharacterName ?? null;

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
                    background: theme.palette.background.paper,
                    zIndex: 20
                }}
                ref={topScrollRef}
            >
                <div style={{width: scrollRef.current?.scrollWidth || '2000px'}}/>
            </div>
            <StyledTableContainer
                onScroll={() => {
                    if (scrollRef.current && topScrollRef.current) {
                        topScrollRef.current.scrollLeft = scrollRef.current.scrollLeft;
                    }
                }}
                ref={scrollRef}
                component={AppPaper}
                sx={{
                    maxWidth: "95%",
                    maxHeight: "60vh",
                    overflow: "auto",
                    borderRadius: 2,
                    marginRight: '10px',
                    marginBottom: '10px'
                }}
                className="table-container"
                style={{display: 'inline-block'}}
            >
                <AppTable>
                    <TableHeader
                        attackerCharacterName={effectiveAttackerName}
                        defenderCharacterName={effectiveDefenderName}
                        columns={state.columns}
                        addColumn={() => tableService.addColumn()}
                        setColumns={(columns: string[]) => tableService.setColumns(columns)}/>
                    <AppTableBody>
                        {state.rows.map((row, rowIndex) => (
                            <TableRowComponent
                                key={rowIndex}
                                row={row}
                                rows={state.rows}
                                rowIndex={rowIndex}
                                columns={state.columns}
                                values={state.values}
                                handleValueChange={(rowIndex: number, colIndex: number, newValue: string) => tableService.updateValue(rowIndex, colIndex, newValue)}
                                setRows={(rows: string[]) => tableService.setRows(rows)}
                                removeRow={(rowIndex: number) => tableService.removeRow(rowIndex)}
                                moveRowDown={(rowIndex: number) => tableService.moveRowDown(rowIndex)}
                                moveRowUp={(rowIndex: number) => tableService.moveRowUp(rowIndex)}
                                rowFrequency={state.rowFrequencies[rowIndex]}
                                onRowFrequencyChange={(newValue: string) => tableService.updateRowFrequency(rowIndex, newValue)}/>
                        ))}
                    </AppTableBody>
                    <AppTableFooter>
<FrequencyRow
                            defenderCharacterName={effectiveDefenderName}
                            columns={state.columns}
                            columnFrequencies={state.columnFrequencies}
                            handleColumnFrequencyChange={(colIndex: number, newValue: string) => tableService.updateColumnFrequency(colIndex, newValue)}
                            expectedValue={tableService.calculateExpectedValue()}/>
                    </AppTableFooter>
                    <TableFooterComponent
                        addRow={() => tableService.addRow()}
                        removeRow={() => {
                        }}
                        columns={state.columns}
                        moveColumnLeft={(colIndex: number) => tableService.moveColumnLeft(colIndex)}
                        moveColumnRight={(colIndex: number) => tableService.moveColumnRight(colIndex)}
                        removeColumn={(colIndex: number) => tableService.removeColumn(colIndex)}/>
                </AppTable>
            </StyledTableContainer>
        </>
    );
}

function FrequencyRow({defenderCharacterName, columns, columnFrequencies, handleColumnFrequencyChange, expectedValue}: FrequencyRowProps) {
    return (
        <AppTableRow className="frozen-last-row" component="tr">
            <AppTableCell className="frozen-frequency-cell" sx={{fontWeight: "bold"}}>
                {defenderCharacterName ?? "P2"} Frequencies
            </AppTableCell>
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                    <NumberField.Root
                        value={toNumberFieldValue(columnFrequencies[colIndex])}
                        onValueChange={(value) => handleColumnFrequencyChange(colIndex, String(value ?? ''))}
                        min={0}
                        max={1}
                        step={0.01}
                    >
                        <NumberField.Input
                            style={{width: "60px"}}
                        />
                    </NumberField.Root>
                </AppTableCell>
            ))}
            <AppTableCell className="frozen-last-column" sx={{textAlign: "center", fontWeight: "bold"}}>
                EV: {expectedValue}
            </AppTableCell>
        </AppTableRow>
    );
}

function TableHeader({attackerCharacterName, defenderCharacterName, columns, addColumn, setColumns}: TableHeaderProps) {
    const handleColumnNameChange = (colIndex: number, newName: string) => {
        const updatedColumns = [...columns];
        updatedColumns[colIndex] = newName;
        setColumns(updatedColumns);
    };

    return (
        <AppTableHead>
            <AppTableRow>
                <AppTableCell className="frozen-corner-cell" sx={{fontWeight: "bold"}}>
                    Moves ({attackerCharacterName ?? "P1"} \ {defenderCharacterName ?? "P2"})
                </AppTableCell>
                {columns.map((col, colIndex) => (
                    <EditableTextCell
                        key={colIndex}
                        value={col}
                        onChange={(newValue: string) => handleColumnNameChange(colIndex, newValue)}
                        sx={{textAlign: "center", fontWeight: "bold"}}
                    />
                ))}
                <AppTableCell sx={{textAlign: "center"}}>
                    <AppAddIconButton onClick={addColumn}/>
                </AppTableCell>
                <AppTableCell className="frozen-last-column"/>
                <AppTableCell className="frozen-last-column"/>
            </AppTableRow>
        </AppTableHead>
    );
}

function TableRowComponent({
                               row,
                               rows,
                               rowIndex,
                               columns,
                               values,
                               handleValueChange,
                               setRows,
                               moveRowUp,
                               moveRowDown,
                               rowFrequency,
                               onRowFrequencyChange,
                               removeRow
                           }: TableRowComponentProps) {
    const handleRowNameChange = (newName: string) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex] = newName;
        setRows(updatedRows);
    };

    return (
        <AppTableRow>
            <AppTableCell className="frozen-first-column" sx={{fontWeight: "bold"}}>
                <EditableTextCell
                    value={row}
                    onChange={handleRowNameChange}
                    sx={{}}
                />
            </AppTableCell>
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                    <NumberInputField
                        rowIndex={rowIndex}
                        colIndex={colIndex}
                        value={values[rowIndex][colIndex]}
                        onValueChange={(newValue: string) => handleValueChange(rowIndex, colIndex, newValue)}
                    />
                </AppTableCell>
            ))}
            <AppTableCell className="frozen-last-column" sx={{textAlign: "center"}}>
                <NumberField.Root
                    value={toNumberFieldValue(rowFrequency)}
                    onValueChange={(value) => onRowFrequencyChange(String(value ?? ''))}
                    min={0}
                    max={1}
                    step={0.01}
                >
                    <NumberField.Input
                        style={{width: "60px"}}
                    />
                </NumberField.Root>
            </AppTableCell>
            <AppTableCell className="frozen-last-column" sx={{textAlign: "center"}}>
                <AppUpArrowButton onClick={() => moveRowUp(rowIndex)}/>
                <AppRemoveIconButton onClick={() => removeRow(rowIndex)}/>
                <AppDownArrowButton onClick={() => moveRowDown(rowIndex)}/>
            </AppTableCell>
        </AppTableRow>
    );
}

function TableFooterComponent({
                                  addRow,
                                  removeRow,
                                  columns,
                                  moveColumnLeft,
                                  moveColumnRight,
                                  removeColumn
                              }: TableFooterComponentProps) {
    return (
        <AppTableFooter>
            <AppTableRow className="frozen-last-row">
                <AppTableCell className="frozen-footer-cell">
                    <AppAddIconButton onClick={addRow}/>
                    <AppRemoveIconButton onClick={removeRow}/>
                </AppTableCell>
                {columns.map((_, colIndex) => (
                    <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                        <AppLeftArrowButton onClick={() => moveColumnLeft(colIndex)}/>
                        <AppRemoveIconButton onClick={() => removeColumn(colIndex)}/>
                        <AppRightArrowButton onClick={() => moveColumnRight(colIndex)}/>
                    </AppTableCell>
                ))}
                <AppTableCell className="frozen-last-column"/>
                <AppTableCell className="frozen-last-column" sx={{textAlign: 'center'}}>
                </AppTableCell>
            </AppTableRow>
        </AppTableFooter>
    );
}

function NumberInputField({rowIndex, colIndex, value, onValueChange}: NumberInputFieldProps) {
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
        <NumberField.Root
            value={toNumberFieldValue(value)}
            onValueChange={(value) => onValueChange(String(value ?? ''))}
        >
            <NumberField.Input
                ref={inputRef}
                onKeyDown={handleKeyDown}
                style={{width: "60px"}}
                tabIndex={0}
            />
        </NumberField.Root>
    );
}
