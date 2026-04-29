import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Wrappers de tableau cohérents pour tout le dashboard.
 * Styles unifiés : header en muted/uppercase, lignes hoverables, padding régulier.
 *
 * Usage :
 *   <DataTable>
 *     <DataTableHeader>
 *       <DataTableHeaderCell>IMEI</DataTableHeaderCell>
 *       ...
 *     </DataTableHeader>
 *     <DataTableBody>
 *       <DataTableRow>
 *         <DataTableCell>...</DataTableCell>
 *       </DataTableRow>
 *     </DataTableBody>
 *   </DataTable>
 */

export function DataTable({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/70">
      <table className={cn('w-full text-sm', className)} {...props} />
    </div>
  );
}

export function DataTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-muted/40">
      <tr className="border-b border-border/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {children}
      </tr>
    </thead>
  );
}

export function DataTableHeaderCell({
  className,
  children,
}: { className?: string; children: React.ReactNode }) {
  return <th className={cn('px-4 py-3', className)}>{children}</th>;
}

export function DataTableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function DataTableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border/40 last:border-0 transition-colors hover:bg-muted/30',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
}
