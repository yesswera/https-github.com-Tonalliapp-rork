import { useWindowDimensions } from 'react-native';
import { useMemo } from 'react';

export interface ResponsiveInfo {
  isTablet: boolean;
  isPhone: boolean;
  width: number;
  height: number;
  tableColumns: number;
  orderColumns: number;
  contentMaxWidth: number;
  modalMaxWidth: number;
  gridPadding: number;
  inventoryColumns: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isTablet = width >= 768;
    const isPhone = !isTablet;

    return {
      isTablet,
      isPhone,
      width,
      height,
      tableColumns: isTablet ? 5 : 3,
      orderColumns: isTablet ? 2 : 1,
      contentMaxWidth: isTablet ? 720 : width,
      modalMaxWidth: isTablet ? 500 : width,
      gridPadding: isTablet ? 24 : 16,
      inventoryColumns: isTablet ? 2 : 1,
    };
  }, [width, height]);
}
