/*
 *
 * Created by Stone
 * https://github.com/bolan9999
 * Email: shanshang130@gmail.com
 * Date: 2018/6/20
 *
 */

declare module "react-native-drag-to-sort-tags" {
  import { View, ViewProps } from "react-native";
  interface PropType extends ViewProps {
    tags: string[];
    marginHorizontal?: number;
    marginVertical?: number;
    renderTag: (tag: string) => React.ReactElement<View>;
    colorForSelected?: string;
    opacityForDragged?: number;
    onTagsSorted?: (tags: string[]) => any;
    fixBorderRadiusOnAndroid?: boolean;
    selectable?: boolean;
    onSelectChange?: (selectedTags: string[]) => any;
    maxCountSelectable?: number;
    vibration?: number;
    initSelectedTags?: string[];
    longPressResponseTime?: number;
  }

  export class DragToSortTags extends React.Component<PropType> {
    getSortedTags(): string[];

    getSelectedTags(): string[];
  }
}
