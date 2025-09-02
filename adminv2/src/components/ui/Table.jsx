import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

const Table = ({ children, className = '' }) => {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700/30 bg-gray-800/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className={`w-full ${className}`}>
          {children}
        </table>
      </div>
    </div>
  );
};

const TableHeader = ({ children, className = '' }) => (
  <thead className={`bg-gray-800/80 ${className}`}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-gray-700/30 ${className}`}>
    {children}
  </tbody>
);

const TableRow = ({ children, className = '', hover = true, ...props }) => (
  <tr 
    className={`
      ${hover ? 'hover:bg-gray-700/30 transition-colors duration-150' : ''}
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
        px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider
        ${sortable ? 'cursor-pointer hover:text-white select-none' : ''}
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
    className={`px-6 py-4 text-sm text-gray-300 ${className}`}
    {...props}
  >
    {children}
  </td>
);

const TableEmpty = ({ message = 'No data available', colSpan }) => (
  <tr>
    <td 
      colSpan={colSpan} 
      className="px-6 py-12 text-center text-gray-400"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-gray-700/50 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-gray-500 rounded border-dashed" />
        </div>
        <p>{message}</p>
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