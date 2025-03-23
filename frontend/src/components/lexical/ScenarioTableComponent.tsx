import React, {useState, useCallback} from "react";
import {
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    Paper,
    TextField,
} from "@mui/material";
import {NumberField} from '@base-ui-components/react/number-field';

import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditableTextCell from "@/src/components/lexical/EditableTextCell";
import {ArrowBack, ArrowDownward, ArrowForward, ArrowUpward} from "@mui/icons-material";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";

// Table Component (Main Wrapper)
function ScenarioTableComponent({initialRows, initialColumns, initialValues, updateRows, updateColumns, updateValues}) {
    const [rows, setRows] = useState(initialRows);
    const [columns, setColumns] = useState(initialColumns);
    const [values, setValues] = useState(initialValues);
    const [editor] = useLexicalComposerContext();

    const setAndUpdateRows = useCallback((rows) => {
        editor.update(() => {
            setRows(rows);
            updateRows(rows);
        })
    }, [editor]);

    const setAndUpdateColumns = useCallback((columns) => {
        editor.update(() => {
            setColumns(columns);
            updateColumns(columns);
        })
    }, [editor]);

    const setAndUpdateValues = useCallback((values) => {
        editor.update(() => {
            setValues(values);
            updateValues(values);
        })
    }, [editor]);

    const moveRowUp = (rowIndex) => {
        if (rowIndex > 0) {
            const newRows = [...rows];
            const [movedRow] = newRows.splice(rowIndex, 1); // Remove row
            newRows.splice(rowIndex - 1, 0, movedRow); // Insert row above
            setAndUpdateRows(newRows);

            const newValues = [...values];
            const [movedValues] = newValues.splice(rowIndex, 1);
            newValues.splice(rowIndex - 1, 0, movedValues);
            setAndUpdateValues(newValues);
        }
    };

    const moveRowDown = (rowIndex) => {
        if (rowIndex < rows.length - 1) {
            const newRows = [...rows];
            const [movedRow] = newRows.splice(rowIndex, 1);
            newRows.splice(rowIndex + 1, 0, movedRow);
            setAndUpdateRows(newRows);

            const newValues = [...values];
            const [movedValues] = newValues.splice(rowIndex, 1);
            newValues.splice(rowIndex + 1, 0, movedValues);
            setAndUpdateValues(newValues);
        }
    };

    const moveColumnLeft = (colIndex) => {
        if (colIndex > 0) {
            const newColumns = [...columns];
            const [movedColumn] = newColumns.splice(colIndex, 1); // Remove column
            newColumns.splice(colIndex - 1, 0, movedColumn); // Insert column to the left
            setAndUpdateColumns(newColumns);

            const newValues = values.map((row) => {
                const newRow = [...row];
                const [movedValue] = newRow.splice(colIndex, 1);
                newRow.splice(colIndex - 1, 0, movedValue);
                return newRow;
            });
            setAndUpdateValues(newValues);
        }
    };

    const moveColumnRight = (colIndex) => {
        if (colIndex < columns.length - 1) {
            const newColumns = [...columns];
            const [movedColumn] = newColumns.splice(colIndex, 1);
            newColumns.splice(colIndex + 1, 0, movedColumn); // Insert column to the right
            setAndUpdateColumns(newColumns);

            const newValues = values.map((row) => {
                const newRow = [...row];
                const [movedValue] = newRow.splice(colIndex, 1);
                newRow.splice(colIndex + 1, 0, movedValue);
                return newRow;
            });
            setAndUpdateValues(newValues);
        }
    };

    const handleValueChange = (rowIndex, colIndex, newValue) => {
        // If the value is empty or just a "-", allow it
        if (newValue === "" || newValue === "-") {
            const newValues = [...values];
            newValues[rowIndex][colIndex] = newValue; // Set the non-parsed value
            setAndUpdateValues(newValues);
            return;
        }

        // Try to parse the value as a number
        const parsedValue = parseInt(newValue, 10);

        // Only update if parsed value is a valid number
        if (!Number.isNaN(parsedValue)) {
            const newValues = [...values];
            newValues[rowIndex][colIndex] = parsedValue;
            setAndUpdateValues(newValues);
        }
    };

    const addRow = () => {
        const newRow = `Row ${rows.length + 1}`;
        setAndUpdateRows([...rows, newRow]);
        setAndUpdateValues([...values, Array(columns.length).fill(0)]);
    };

    const removeRow = () => {
        if (rows.length > 1) {
            setAndUpdateRows(rows.slice(0, -1));
            setAndUpdateValues(values.slice(0, -1));
        }
    };

    const addColumn = () => {
        const newColumn = `Move ${columns.length + 1}`;
        setAndUpdateColumns([...columns, newColumn]);
        setAndUpdateValues(values.map(row => [...row, 0]));
    };

    const removeColumn = () => {
        if (columns.length > 1) {
            setAndUpdateColumns(columns.slice(0, -1));
            setAndUpdateValues(values.map(row => row.slice(0, -1))); // Remove last column from each row
        }
    };

    return (
        <TableContainer component={Paper} elevation={3}
                        sx={{
                            maxWidth: "90%",
                            overflowX: "auto",
                            borderRadius: 2,
                            marginRight: '10px',
                            marginBottom: '10px'
                        }}
                        className="table-container"
                        display='inline-block'>
            <Table>
                <TableHeader columns={columns} addColumn={addColumn} removeColumn={removeColumn}
                             setColumns={setAndUpdateColumns}/>
                <TableBody>
                    {rows.map((row, rowIndex) => (
                        <TableRowComponent
                            key={rowIndex}
                            row={row}
                            rows={rows}
                            rowIndex={rowIndex}
                            columns={columns}
                            values={values}
                            handleValueChange={handleValueChange}
                            setRows={setAndUpdateRows}
                            removeRow={removeRow}
                            moveRowDown={moveRowDown}
                            moveRowUp={moveRowUp}
                        />
                    ))}
                </TableBody>
                <TableFooterComponent addRow={addRow} removeRow={removeRow} columns={columns}
                                      moveColumnLeft={moveColumnLeft} moveColumnRight={moveColumnRight}/>
            </Table>
        </TableContainer>
    );
}

// Table Header Component
function TableHeader({columns, addColumn, removeColumn, setColumns}) {
    const handleColumnNameChange = (colIndex, newName) => {
        const updatedColumns = [...columns];
        updatedColumns[colIndex] = newName;
        setColumns(updatedColumns);
    };

    return (
        <TableHead>
            <TableRow sx={{backgroundColor: "#f5f5f5"}}>
                <TableCell sx={{fontWeight: "bold"}}>Moves (P1 \ P2)</TableCell>
                {columns.map((col, colIndex) => (
                    <EditableTextCell
                        key={colIndex}
                        value={col}
                        onChange={(newValue) => handleColumnNameChange(colIndex, newValue)}
                        sx={{textAlign: "center", fontWeight: "bold"}}
                    />
                ))}
                <TableCell sx={{textAlign: "center"}}>
                    <IconButton onClick={addColumn} size="small">
                        <AddIcon fontSize="small"/>
                    </IconButton>
                </TableCell>
            </TableRow>
        </TableHead>
    );
}

function TableRowComponent({row, rows, rowIndex, columns, values, handleValueChange, setRows, moveRowUp, moveRowDown}) {
    const handleRowNameChange = (newName) => {
        const updatedRows = [...rows];
        updatedRows[rowIndex] = newName;
        setRows(updatedRows);
    };

    return (
        <TableRow sx={{backgroundColor: rowIndex % 2 ? "#fafafa" : "inherit"}}>
            <EditableTextCell
                value={row}
                onChange={handleRowNameChange}
                sx={{fontWeight: "bold"}}
            />
            {columns.map((_, colIndex) => (
                <TableCell key={colIndex} sx={{textAlign: "center"}}>
                    <NumberInputField
                        value={values[rowIndex][colIndex]}
                        onValueChange={(newValue) => handleValueChange(rowIndex, colIndex, newValue)}
                    />
                </TableCell>
            ))}
            <TableCell sx={{textAlign: "center"}}>
                <IconButton size="small" onClick={() => moveRowUp(rowIndex)}>
                    <ArrowUpward fontSize="small"/>
                </IconButton>
                <IconButton size="small" onClick={() => moveRowDown(rowIndex)}>
                    <ArrowDownward fontSize="small"/>
                </IconButton>
            </TableCell>
        </TableRow>
    );
}

function TableFooterComponent({addRow, removeRow, columns, moveColumnLeft, moveColumnRight}) {
    return (
        <TableFooter>
            <TableRow>
                <TableCell colSpan={1}> {/* Empty cell for the row control buttons */}
                    <IconButton onClick={addRow} size="small">
                        <AddIcon fontSize="small"/>
                    </IconButton>
                    <IconButton onClick={removeRow} size="small">
                        <RemoveIcon fontSize="small"/>
                    </IconButton>
                </TableCell>

                {/* Create cells for each column with move left and move right buttons */}
                {columns.map((_, colIndex) => (
                    <TableCell key={colIndex} sx={{textAlign: "center"}}>
                        <IconButton onClick={() => moveColumnLeft(colIndex)} size="small">
                            <ArrowBack fontSize="small"/>
                        </IconButton>
                        <IconButton onClick={() => moveColumnRight(colIndex)} size="small">
                            <ArrowForward fontSize="small"/>
                        </IconButton>
                    </TableCell>
                ))}
            </TableRow>
        </TableFooter>
    );
}


// Number Input Field Component (For rendering individual number inputs)
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

export default ScenarioTableComponent;