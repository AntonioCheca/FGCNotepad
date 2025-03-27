import React, {useState, useCallback, useEffect} from "react";
import {NumberField} from '@base-ui-components/react/number-field';

import EditableTextCell from "@/src/components/lexical/EditableTextCell";
import {useLexicalComposerContext} from "@lexical/react/LexicalComposerContext";
import {$createParagraphNode, $getNodeByKey} from "lexical";
import useSolverGames from "@/hooks/useSolverGame";
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

// Table Component (Main Wrapper)
function ScenarioTableComponent({
                                    initialRows,
                                    initialColumns,
                                    initialValues,
                                    initialRowFrequencies,
                                    initialColumnFrequencies,
                                    initialExpectedValue,
                                    updateRows,
                                    updateColumns,
                                    updateValues,
                                    updateRowFrequencies,
                                    updateColumnFrequencies,
                                    updateExpectedValue,
                                    nodeKey
                                }) {
    const [rows, setRows] = useState(initialRows);
    const [columns, setColumns] = useState(initialColumns);
    const [values, setValues] = useState(initialValues);
    const [rowFrequencies, setRowFrequencies] = useState(
        initialRowFrequencies || Array(initialRows.length).fill(1 / initialRows.length));
    const [columnFrequencies, setColumnFrequencies] = useState(
        initialColumnFrequencies || Array(initialColumns.length).fill(1 / initialColumns.length)
    );
    const [expectedValue, setExpectedValue] = useState(initialExpectedValue || 0);
    const [editor] = useLexicalComposerContext();
    const {solveGame} = useSolverGames();

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

    const setAndUpdateRowFrequencies = useCallback((rowFrequencies) => {
        editor.update(() => {
            setRowFrequencies(rowFrequencies);
            updateRowFrequencies(rowFrequencies);
        })
    }, [editor]);

    const setAndUpdateColumnFrequencies = useCallback((columnFrequencies) => {
        editor.update(() => {
            setColumnFrequencies(columnFrequencies);
            updateColumnFrequencies(columnFrequencies);
        })
    }, [editor]);

    const setAndUpdateExpectedValue = useCallback((expectedValue) => {
        editor.update(() => {
            setExpectedValue(expectedValue);
            updateExpectedValue(expectedValue);
        })
    }, [editor]);

    const handleDelete = useCallback(() => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node) {
                node.remove();
            }
        });
    }, [editor, nodeKey]);

    useEffect(() => {
        editor.update(() => {
            const node = $getNodeByKey(nodeKey);
            if (node) {
                const nextSibling = node.getNextSibling();
                if (!nextSibling) {
                    const paragraph = $createParagraphNode();
                    node.insertAfter(paragraph);
                }
            }
        });
    }, [editor, nodeKey]);

    const handleBottomAreaClick = useCallback((event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const isBottomArea = event.clientY > rect.bottom - 20;

        if (isBottomArea) {
            editor.update(() => {
                const node = $getNodeByKey(nodeKey);
                if (node) {
                    const nextSibling = node.getNextSibling();
                    if (nextSibling) {
                        nextSibling.selectStart();
                    } else {
                        const paragraph = $createParagraphNode();
                        node.insertAfter(paragraph);
                        paragraph.selectStart();
                    }
                    const previousSibling = node.getPreviousSibling();
                    if (previousSibling) {
                        previousSibling.selectStart();
                    } else {
                        const paragraph = $createParagraphNode();
                        node.insertBefore(paragraph);
                        paragraph.selectStart();
                    }
                }
            });
        }
    }, [editor, nodeKey]);

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

            const newRowFrequencies = [...rowFrequencies];
            const [movedFreq] = newRowFrequencies.splice(rowIndex, 1);
            newRowFrequencies.splice(rowIndex - 1, 0, movedFreq);
            setAndUpdateRowFrequencies(newRowFrequencies)
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

            const newRowFrequencies = [...rowFrequencies];
            const [movedFreq] = newRowFrequencies.splice(rowIndex, 1);
            newRowFrequencies.splice(rowIndex + 1, 0, movedFreq);
            setAndUpdateRowFrequencies(newRowFrequencies);
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

            const newColumnFrequencies = [...columnFrequencies];
            const [movedFreq] = newColumnFrequencies.splice(colIndex, 1);
            newColumnFrequencies.splice(colIndex - 1, 0, movedFreq);
            setAndUpdateColumnFrequencies(newColumnFrequencies);
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

            const newColumnFrequencies = [...columnFrequencies];
            const [movedFreq] = newColumnFrequencies.splice(colIndex, 1);
            newColumnFrequencies.splice(colIndex + 1, 0, movedFreq);
            setAndUpdateColumnFrequencies(newColumnFrequencies);
        }
    };

    const handleRowFrequencyChange = (rowIndex, newValue) => {
        if (newValue === "" || newValue === "0." || (parseFloat(newValue) >= 0 && parseFloat(newValue) <= 1)) {
            const newFrequencies = [...rowFrequencies];
            newFrequencies[rowIndex] = (newValue === "" || newValue === "0.") ? newValue : parseFloat(newValue);
            setAndUpdateRowFrequencies(newFrequencies);
        }
    };

    const handleColumnFrequencyChange = (colIndex, newValue) => {
        if (newValue === "" || newValue === "0." || (parseFloat(newValue) >= 0 && parseFloat(newValue) <= 1)) {
            const newFrequencies = [...columnFrequencies];
            newFrequencies[colIndex] = (newValue === "" || newValue === "0.") ? newValue : parseFloat(newValue);
            setAndUpdateColumnFrequencies(newFrequencies);
        }
    };

    // Calculate expected value
    const calculateExpectedValue = () => {
        let ev = 0;
        for (let i = 0; i < rows.length; i++) {
            for (let j = 0; j < columns.length; j++) {
                // Skip if any frequency is not a valid number
                if (typeof rowFrequencies[i] !== 'number' || typeof columnFrequencies[j] !== 'number') {
                    continue;
                }
                ev += values[i][j] * rowFrequencies[i] * columnFrequencies[j];
            }
        }
        return ev.toFixed(2);
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
        const newFrequencies = Array(rows.length + 1).fill(1 / (rows.length + 1));
        setAndUpdateRowFrequencies(newFrequencies);
    };

    const addColumn = () => {
        const newColumn = `Move ${columns.length + 1}`;
        setAndUpdateColumns([...columns, newColumn]);
        setAndUpdateValues(values.map(row => [...row, 0]));
        const newFrequencies = Array(rows.length - 1).fill(1 / (rows.length - 1));
        setAndUpdateRowFrequencies(newFrequencies);
    };

    const removeRow = (rowIndex) => {
        if (rows.length > 1) {
            const newRows = [...rows];
            newRows.splice(rowIndex, 1);
            setAndUpdateRows(newRows);

            const newValues = [...values];
            newValues.splice(rowIndex, 1);
            setAndUpdateValues(newValues);

            const newFrequencies = Array(newRows.length).fill(1 / newRows.length);
            setAndUpdateRowFrequencies(newFrequencies);
        }
    };

    const removeColumn = (colIndex) => {
        if (columns.length > 1) {
            const newColumns = [...columns];
            newColumns.splice(colIndex, 1);
            setAndUpdateColumns(newColumns);

            const newValues = values.map(row => {
                const newRow = [...row];
                newRow.splice(colIndex, 1);
                return newRow;
            });
            setAndUpdateValues(newValues);

            const newFrequencies = Array(newColumns.length).fill(1 / newColumns.length);
            setAndUpdateColumnFrequencies(newFrequencies);
        }
    };

    const formatPayoffMatrix = () => {
        // Prepare the payoff matrix in the expected format for solving the game
        const payoffMatrix = {};

        rows.forEach((row, rowIndex) => {
            const rowName = row; // Row names are the values in `rows`
            payoffMatrix[rowName] = {};

            columns.forEach((col, colIndex) => {
                payoffMatrix[rowName][col] = values[rowIndex][colIndex]; // Payoff value;
            });
        });

        // Call the API to solve the game with the payoff matrix
        solveGame(payoffMatrix).then((result) => {
            // Parse the optimal frequencies and update state
            if (result && result.P1 && result.P2) {
                // Map the optimal frequencies for rows (P1)
                const newRowFrequencies = rows.map(rowName => {
                    // Find the matching frequency in the result
                    return result.P1[rowName] || 0;
                });

                // Map the optimal frequencies for columns (P2)
                const newColumnFrequencies = columns.map(colName => {
                    // Find the matching frequency in the result
                    return result.P2[colName] || 0;
                });

                // Update the state with the new frequencies
                setAndUpdateRowFrequencies(newRowFrequencies);
                setAndUpdateColumnFrequencies(newColumnFrequencies);

                // Also calculate and update the expected value based on the new optimal strategy
                const expectedVal = calculateExpectedValue();
                setAndUpdateExpectedValue(expectedVal);
            }
        }).catch((error) => {
            console.error("Error solving game:", error);
        });
    };

    return (
        <div className="scenario-table-container"
             style={{
                 position: 'relative',
                 marginTop: '10px'
             }}
             onClick={handleBottomAreaClick}
        >
            <button
                className="delete-button"
                onClick={handleDelete}
                style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: '#ff4d4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    zIndex: 2
                }}
            >
                ✕
            </button>
            {/* Button to trigger matrix solving */}
            <button
                className="solve-game-button"
                onClick={formatPayoffMatrix}
                style={{
                    position: 'absolute',
                    top: '40px',
                    right: '5px',
                    background: "#007bff",
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    cursor: 'pointer',
                    zIndex: 2
                }}>
                S
            </button>
            <AppTableContainer component={AppPaper} elevation={3}
                               sx={{
                                   maxWidth: "95%",
                                   overflowX: "auto",
                                   borderRadius: 2,
                                   marginRight: '10px',
                                   marginBottom: '10px'
                               }}
                               className="table-container"
                               display='inline-block'>
                <AppTable>
                    <TableHeader
                        columns={columns}
                        addColumn={addColumn}
                        removeColumn={removeColumn}
                        setColumns={setAndUpdateColumns}
                    />
                    <AppTableBody>
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
                                // New props
                                rowFrequency={rowFrequencies[rowIndex]}
                                onRowFrequencyChange={(newValue) => handleRowFrequencyChange(rowIndex, newValue)}
                            />
                        ))}
                        {/* Add frequency row */}
                        <FrequencyRow
                            columns={columns}
                            columnFrequencies={columnFrequencies}
                            handleColumnFrequencyChange={handleColumnFrequencyChange}
                            expectedValue={calculateExpectedValue()}
                        />
                    </AppTableBody>
                    <TableFooterComponent
                        addRow={addRow}
                        removeRow={removeRow}
                        columns={columns}
                        moveColumnLeft={moveColumnLeft}
                        moveColumnRight={moveColumnRight}
                        removeColumn={removeColumn}
                    />
                </AppTable>
            </AppTableContainer>
        </div>
    );
}

function FrequencyRow({columns, columnFrequencies, handleColumnFrequencyChange, expectedValue}) {
    return (
        <AppTableRow sx={{backgroundColor: "#f0f0f0"}}>
            <AppTableCell sx={{fontWeight: "bold"}}>P2 Frequencies</AppTableCell>
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


// Table Header Component
function TableHeader({columns, addColumn, removeColumn, setColumns}) {
    const handleColumnNameChange = (colIndex, newName) => {
        const updatedColumns = [...columns];
        updatedColumns[colIndex] = newName;
        setColumns(updatedColumns);
    };

    return (
        <AppTableHead>
            <AppTableRow sx={{backgroundColor: "#f5f5f5"}}>
                <AppTableCell sx={{fontWeight: "bold"}}>Moves (P1 \ P2)</AppTableCell>
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

// Modify TableRowComponent to add frequency column
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
            <EditableTextCell
                value={row}
                onChange={handleRowNameChange}
                sx={{fontWeight: "bold"}}
            />
            {columns.map((_, colIndex) => (
                <AppTableCell key={colIndex} sx={{textAlign: "center"}}>
                    <NumberInputField
                        value={values[rowIndex][colIndex]}
                        onValueChange={(newValue) => handleValueChange(rowIndex, colIndex, newValue)}
                    />
                </AppTableCell>
            ))}
            {/* Add frequency cell */}
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
                <AppTableCell colSpan={1}> {/* Empty cell for the row control buttons */}
                    <AppAddIconButton onClick={addRow} size="small"/>
                    <AppRemoveIconButton onClick={removeRow} size="small"/>
                </AppTableCell>

                {/* Create cells for each column with move left and move right buttons */}
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