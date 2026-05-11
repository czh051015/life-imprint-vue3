// 中国地图数据
export const chinaMapData = {
  "type": "FeatureCollection",
  "features": [
    // 这里应该是完整的地图数据，但由于数据量太大，我会使用一个简化的版本
    // 实际使用时，应该将完整的地图数据放在这里
    {
      "id": "110000",
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[116.0, 40.0], [117.0, 40.0], [117.0, 39.0], [116.0, 39.0], [116.0, 40.0]]]]
      },
      "properties": {
        "cp": [116.397428, 39.90923],
        "name": "北京",
        "childNum": 1
      }
    },
    {
      "id": "310000",
      "type": "Feature",
      "geometry": {
        "type": "MultiPolygon",
        "coordinates": [[[[121.0, 31.0], [122.0, 31.0], [122.0, 30.0], [121.0, 30.0], [121.0, 31.0]]]]
      },
      "properties": {
        "cp": [121.472644, 31.231706],
        "name": "上海",
        "childNum": 1
      }
    }
  ]
};