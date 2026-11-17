'use client';
import { FixedSizeList, VariableSizeList } from 'react-window';
import { ReactNode, useRef, useEffect } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight?: number; // fixed height; if omitted, uses getItemSize
  getItemSize?: (index: number) => number; // variable height
  height: number;
  width?: string | number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  overscanCount?: number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  getItemSize,
  height,
  width = '100%',
  renderItem,
  className,
  overscanCount = 5,
}: VirtualizedListProps<T>) {
  if (items.length === 0) {
    return <div className={className}><p className="text-slate-500 text-center py-8">No items</p></div>;
  }

  const useVariable = !itemHeight && !!getItemSize;

  if (useVariable && getItemSize) {
    return (
      <div className={className}>
        <VariableSizeList
          height={height}
          width={width}
          itemCount={items.length}
          itemSize={getItemSize}
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
        </VariableSizeList>
      </div>
    );
  }

  return (
    <div className={className}>
      <FixedSizeList
        height={height}
        width={width}
        itemCount={items.length}
        itemSize={itemHeight || 40}
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
      </FixedSizeList>
    </div>
  );
}
