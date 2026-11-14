'use client';
import { FixedSizeList as List } from 'react-window';
import { ReactNode } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  width?: string | number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscanCount?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  height,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  if (items.length === 0) {
    return <div className={className}><p className="text-slate-500 text-center py-8">No items</p></div>;
  }

  return (
    <div className={className}>
      <List
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscanCount}
      >
        {({ index, style }: { index: number; style: React.CSSProperties }) => {
          const item = items[index];
          if (!item) return null;
          return (
            <div style={style}>
              {renderItem(item, index)}
            </div>
          );
        }}
      </List>
    </div>
  );
}
