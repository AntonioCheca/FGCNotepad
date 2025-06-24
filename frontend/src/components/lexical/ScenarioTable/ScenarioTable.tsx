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

// Enhanced styled components for proper frozen headers and columns
const StyledTableContainer = styled(AppTableContainer)(({ theme }) => ({
    '& .MuiTable-root': {
        // Frozen header row
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
        // Frozen first column
        '& .frozen-first-column': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: 'white',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            // Ensure content doesn't get cut off
            minWidth: 'max-content',
        },
        // Frozen corner cell (intersection of frozen row and column)
        '& .frozen-corner-cell': {
            position: 'sticky',
            left: 0,
            top: 0,
            zIndex: 15,
            backgroundColor: '#f5f5f5',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        },
        // Special styling for frequency row first column
        '& .frozen-frequency-cell': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: '#f0f0f0', // Match frequency row background
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        },
        // Special styling for footer first column
        '& .frozen-footer-cell': {
            position: 'sticky',
            left: 0,
            zIndex: 5,
            backgroundColor: 'white',
            boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
            minWidth: 'max-content',
        }
    }
}));

export function ScenarioTable({ state, tableService }: ScenarioTableProps) {
    return (
        <StyledTableContainer
            component={AppPaper}
            elevation={3}
            sx={{
                maxWidth: "95%",
                overflowX: "auto",
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
                    setColumns={(columns) => tableService.actions.setAndUpdateColumns(columns)}
                />
                <AppTableBody>
                    {state.rows.map((row, rowIndex) => (
                        <TableRowComponent
                            key={rowIndex}
                            row={row}
                            rows={state.rows}
                            rowIndex={rowIndex}
                            columns={state.columns}
                            values={state.values}
                            handleValueChange={(rowIndex, colIndex, newValue) =>
                                tableService.updateValue(rowIndex, colIndex, newValue)
                            }
                            setRows={(rows) => tableService.actions.setAndUpdateRows(rows)}
                            removeRow={(rowIndex) => tableService.removeRow(rowIndex)}
                            moveRowDown={(rowIndex) => tableService.moveRowDown(rowIndex)}
                            moveRowUp={(rowIndex) => tableService.moveRowUp(rowIndex)}
                            rowFrequency={state.rowFrequencies[rowIndex]}
                            onRowFrequencyChange={(newValue) =>
                                tableService.updateRowFrequency(rowIndex, newValue)
                            }
                        />
                    ))}
                    <FrequencyRow
                        columns={state.columns}
                        columnFrequencies={state.columnFrequencies}
                        handleColumnFrequencyChange={(colIndex, newValue) =>
                            tableService.updateColumnFrequency(colIndex, newValue)
                        }
                        expectedValue={tableService.calculateExpectedValue()}
                    />
                </AppTableBody>
                <TableFooterComponent
                    addRow={() => tableService.addRow()}
                    removeRow={() => {}} // This needs to be handled differently
                    columns={state.columns}
                    moveColumnLeft={(colIndex) => tableService.moveColumnLeft(colIndex)}
                    moveColumnRight={(colIndex) => tableService.moveColumnRight(colIndex)}
                    removeColumn={(colIndex) => tableService.removeColumn(colIndex)}
                />
            </AppTable>
        </StyledTableContainer>
    );
}

function FrequencyRow({columns, columnFrequencies, handleColumnFrequencyChange, expectedValue}) {
    return (
        <AppTableRow sx={{backgroundColor: "#f0f0f0"}}>
            <AppTableCell
                sx={{fontWeight: "bold"}}
                className="frozen-frequency-cell"
            >
                P2 Frequencies
            </AppTableCell>
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                    <NumberField.Root>
                        <NumberField.Input
                            value={columnFrequencies[colIndex]}
                            onChange={(e) => handleColumnFrequencyChange(colIndex, e.target.value)}
                            size="small"
                            sx={{width: "60px"}}
                            inputProps={{
                                min: 0,
                                max: 1,
                                step: 0.01
                            }}
                        />
                    </NumberField.Root>
                </AppTableCell>
            ))}
            <AppTableCell sx={{textAlign: "center", fontWeight: "bold"}}>
                EV: {expectedValue}
            </AppTableCell>
        </AppTableRow>
    );
}

function TableHeader({columns, addColumn, removeColumn, setColumns}) {
    const handleColumnNameChange = (colIndex, newName) => {
        const updatedColumns = [...columns];
        updatedColumns[colIndex] = newName;
        setColumns(updatedColumns);
    };

    return (
        <AppTableHead>
            <AppTableRow sx={{backgroundColor: "#f5f5f5"}}>
                <AppTableCell
                    sx={{fontWeight: "bold"}}
                    className="frozen-corner-cell"
                >
                    Moves (P1 \ P2)
                </AppTableCell>
                {columns.map((col, colIndex) => (
                    <EditableTextCell
                        key={colIndex}
                        value={col}
                        onChange={(newValue) => handleColumnNameChange(colIndex, newValue)}
                        sx={{textAlign: "center", fontWeight: "bold"}}
                    />
                ))}
                <AppTableCell sx={{textAlign: "center"}}>
                    <AppAddIconButton onClick={addColumn} size="small"/>
                </AppTableCell>
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
                               removeRow,
                           }) {
    const handleRowNameChange = (newName) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex] = newName;
        setRows(updatedRows);
    };

    return (
        <AppTableRow sx={{backgroundColor: rowIndex % 2 ? "#fafafa" : "inherit"}}>
            <AppTableCell
                sx={{fontWeight: "bold"}}
                className="frozen-first-column"
            >
                <EditableTextCell
                    value={row}
                    onChange={handleRowNameChange}
                />
            </AppTableCell>
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                    <NumberInputField
                        value={values[rowIndex][colIndex]}
                        onValueChange={(newValue) => handleValueChange(rowIndex, colIndex, newValue)}
                    />
                </AppTableCell>
            ))}
            <AppTableCell sx={{textAlign: "center"}}>
                <NumberField.Root>
                    <NumberField.Input
                        value={rowFrequency}
                        onChange={(e) => onRowFrequencyChange(e.target.value)}
                        size="small"
                        sx={{width: "60px"}}
                        inputProps={{
                            min: 0,
                            max: 1,
                            step: 0.01
                        }}
                    />
                </NumberField.Root>
            </AppTableCell>
            <AppTableCell sx={{textAlign: "center"}}>
                <AppUpArrowButton size="small" onClick={() => moveRowUp(rowIndex)}/>
                <AppRemoveIconButton size="small" onClick={() => removeRow(rowIndex)}/>
                <AppDownArrowButton size="small" onClick={() => moveRowDown(rowIndex)}/>
            </AppTableCell>
        </AppTableRow>
    );
}

function TableFooterComponent({addRow, removeRow, columns, moveColumnLeft, moveColumnRight, removeColumn}) {
    return (
        <AppTableFooter>
            <AppTableRow>
                <AppTableCell
                    colSpan={1}
                    className="frozen-footer-cell"
                >
                    <AppAddIconButton onClick={addRow} size="small"/>
                    <AppRemoveIconButton onClick={removeRow} size="small"/>
                </AppTableCell>
                {columns.map((_, colIndex) => (
                    <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                        <AppLeftArrowButton onClick={() => moveColumnLeft(colIndex)} size="small"/>
                        <AppRemoveIconButton onClick={() => removeColumn(colIndex)} size="small"/>
                        <AppRightArrowButton onClick={() => moveColumnRight(colIndex)} size="small"/>
                    </AppTableCell>
                ))}
            </AppTableRow>
        </AppTableFooter>
    );
}

function NumberInputField({value, onValueChange}) {
    return (
        <NumberField.Root>
            <NumberField.Input
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                size="small"
                sx={{width: "60px"}}
            />
        </NumberField.Root>
    );
}
