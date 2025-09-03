import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-hidden rounded-lg border border-orange-500/30 bg-black backdrop-blur-sm shadow-sm">
      <div className="overflow-x-auto">
        <table className={`w-full ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
};

const TableHeader = ({ children, className = '' }) => (
  <thead className={`bg-orange-500/10 ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-orange-500/20 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = '', hover = true, ...props }) => (
  <tr 
    className={`
      ${hover ? 'hover:bg-orange-500/10 transition-colors duration-150' : ''}
      ${className}
    `}
    {...props}
  >
    {children}
  </tr>
);

const TableHead = ({ 
  children, 
  className = '', 
  sortable = false, 
  sortDirection = null,
  onSort,
  ...props 
}) => {
  const handleSort = () => {
    if (sortable && onSort) {
      const newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      onSort(newDirection);
    }
  };

  const SortIcon = sortDirection === 'asc' ? ChevronUp : 
                   sortDirection === 'desc' ? ChevronDown : 
                   ChevronsUpDown;

  return (
    <th 
      className={`
        px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide
        ${sortable ? 'cursor-pointer hover:text-orange-400 select-none' : ''}
        ${className}
      `}
      onClick={handleSort}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && <SortIcon className="w-4 h-4" />}
      </div>
    </th>
  );
};

const TableCell = ({ children, className = '', ...props }) => (
  <td 
    className={`px-4 py-3 text-sm text-white ${className}`}
    {...props}
  >
    {children}
  </td>
);

const TableEmpty = ({ message = 'No data available', colSpan }) => (
  <tr>
    <td 
      colSpan={colSpan} 
      className="px-4 py-8 text-center text-orange-300"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-orange-500 rounded border-dashed" />
        </div>
        <p className="text-sm">{message}</p>
      </div>
    </td>
  </tr>
);

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;
Table.Empty = TableEmpty;

export default Table;