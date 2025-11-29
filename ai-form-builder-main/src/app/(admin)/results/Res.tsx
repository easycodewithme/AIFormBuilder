import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@nextui-org/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface ResultColumn {
  key: string;
  label: string;
  type?: string;
}

export interface ResultRow {
  values: (string | number | boolean | null)[];
}

interface ResProps {
  columns: ResultColumn[] | null;
  rows: ResultRow[] | null;
}

const Res: React.FC<ResProps> = ({ columns, rows }) => {
  if (!columns || !rows || columns.length === 0) {
    return <p className="px-4">No submissions on this form yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table aria-label="Form submissions table">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key} className="font-semibold">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      style={{
                        width: "150px",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {column.label}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{column.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TableColumn>
          )}
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.values.map((value, idx) => {
                const col = columns[idx];
                if (col?.type === "image" && typeof value === "string" && value) {
                  return (
                    <TableCell key={idx} className="font-light">
                      <img
                        src={value}
                        alt={col.label}
                        className="h-16 w-16 object-cover rounded"
                      />
                    </TableCell>
                  );
                }
                const stringValue = String(value ?? "");
                return (
                  <TableCell key={idx} className="font-light">
                    <div className="line-clamp-2">{stringValue}</div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default Res;
