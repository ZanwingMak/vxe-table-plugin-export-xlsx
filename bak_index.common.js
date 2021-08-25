"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = exports.VXETablePluginExportXLSX = void 0;

var _xeUtils = _interopRequireDefault(require("xe-utils"));

var ExcelJS = _interopRequireWildcard(require("exceljs"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var defaultHeaderBackgroundColor = 'f8f8f9';
var defaultCellFontColor = '606266';
var defaultCellBorderStyle = 'thin';
var defaultCellBorderColor = 'e8eaec';

function getCellLabel(column, cellValue) {
  if (cellValue) {
    switch (column.cellType) {
      case 'string':
        return _xeUtils["default"].toString(cellValue);

      case 'number':
        if (!isNaN(cellValue)) {
          return Number(cellValue);
        }

        break;

      default:
        if (cellValue.length < 12 && !isNaN(cellValue)) {
          return Number(cellValue);
        }

        break;
    }
  }

  return cellValue;
}

function getFooterData(opts, footerData) {
  var footerFilterMethod = opts.footerFilterMethod;
  return footerFilterMethod ? footerData.filter(function (items, index) {
    return footerFilterMethod({
      items: items,
      $rowIndex: index
    });
  }) : footerData;
}

function getValidColumn(column) {
  var childNodes = column.childNodes;
  var isColGroup = childNodes && childNodes.length;

  if (isColGroup) {
    return getValidColumn(childNodes[0]);
  }

  return column;
}

function setExcelRowHeight(excelRow, height) {
  if (height) {
    excelRow.height = _xeUtils["default"].floor(height * 0.75, 12);
  }
}

function setExcelCellStyle(excelCell, align) {
  excelCell.protection = {
    locked: false
  };
  excelCell.alignment = {
    vertical: 'middle',
    horizontal: align || 'left'
  };
}

function getDefaultBorderStyle() {
  return {
    top: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    left: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    bottom: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    },
    right: {
      style: defaultCellBorderStyle,
      color: {
        argb: defaultCellBorderColor
      }
    }
  };
}

function exportXLSX(params) {
  var msgKey = 'xlsx';
  console.log('params:', params);
  var $table = params.$table,
      options = params.options,
      datas = params.datas;
  var columns = params.options.lastRowColums;
  var colgroups = params.options.realColGroups;
  var $vxe = $table.$vxe,
      rowHeight = $table.rowHeight,
      allHeaderAlign = $table.headerAlign,
      allAlign = $table.align,
      allFooterAlign = $table.footerAlign;
  var modal = $vxe.modal,
      t = $vxe.t;
  var message = options.message,
      sheetName = options.sheetName,
      isHeader = options.isHeader,
      isFooter = options.isFooter,
      isMerge = options.isMerge,
      isColgroup = options.isColgroup,
      original = options.original,
      useStyle = options.useStyle,
      sheetMethod = options.sheetMethod;
  var showMsg = message !== false;
  var mergeCells = $table.getMergeCells();
  var colList = [];
  var footList = [];
  var sheetCols = [];
  var sheetMerges = [];
  var beforeRowCount = 0;
  var colHead = {};
  columns.forEach(function (column) {
    try {
      var property = column.property;
      var key = column.property;
      var renderWidth = column.width;
      colHead[key] = original ? property : column.title;
      column.id = column.property;
      column.parentId = column.params.parentId;
      sheetCols.push({
        key: key,
        width: Math.ceil(renderWidth / 8)
      });
    } catch (error) {
      console.log(error);
    }
  });
  console.log('columns:', columns); // 处理表头

  if (isHeader) {
    // 处理分组
    if (isColgroup && !original && colgroups) {
      console.log('colgroups:', colgroups);
      colgroups.forEach(function (cols, rIndex) {
        var groupHead = {};
        columns.forEach(function (column) {
          groupHead[column.property] = null;
        });
        cols.forEach(function (column) {
          column.id = column.property;
          column.parentId = column.params.parentId; // const { _colSpan, _rowSpan } = column

          var _colSpan = column.colSpan;
          var _rowSpan = column.rowSpan;
          var validColumn = getValidColumn(column);
          var columnIndex = columns.findIndex(function (item) {
            return item.key.startsWith(validColumn.key);
          });
          groupHead[validColumn.property] = original ? validColumn.property : column.title;

          if (_colSpan > 1 || _rowSpan > 1) {
            sheetMerges.push({
              s: {
                r: rIndex,
                c: columnIndex
              },
              e: {
                r: rIndex + _rowSpan - 1,
                c: columnIndex + _colSpan - 1
              }
            });
          }
        });
        colList.push(groupHead);
      });
    } else {
      colList.push(colHead);
    }

    beforeRowCount += colList.length;
    console.log('colList:', colList);
  } // 处理合并


  if (isMerge && !original) {
    mergeCells.forEach(function (mergeItem) {
      var mergeRowIndex = mergeItem.row,
          mergeRowspan = mergeItem.rowspan,
          mergeColIndex = mergeItem.col,
          mergeColspan = mergeItem.colspan;
      sheetMerges.push({
        s: {
          r: mergeRowIndex + beforeRowCount,
          c: mergeColIndex
        },
        e: {
          r: mergeRowIndex + beforeRowCount + mergeRowspan - 1,
          c: mergeColIndex + mergeColspan - 1
        }
      });
    });
  }

  var rowList = datas.map(function (item) {
    var rest = {};
    columns.forEach(function (column) {
      rest[column.property] = getCellLabel(column, item._row[column.property]);
      column.id = column.property;
    });
    return rest;
  });
  console.log('rowList:', rowList);
  beforeRowCount += rowList.length; // 处理表尾

  if (isFooter) {
    var _$table$getTableData = $table.getTableData(),
        footerData = _$table$getTableData.footerData;

    var footers = getFooterData(options, footerData);
    var mergeFooterItems = $table.getMergeFooterItems(); // 处理合并

    if (isMerge && !original) {
      mergeFooterItems.forEach(function (mergeItem) {
        var mergeRowIndex = mergeItem.row,
            mergeRowspan = mergeItem.rowspan,
            mergeColIndex = mergeItem.col,
            mergeColspan = mergeItem.colspan;
        sheetMerges.push({
          s: {
            r: mergeRowIndex + beforeRowCount,
            c: mergeColIndex
          },
          e: {
            r: mergeRowIndex + beforeRowCount + mergeRowspan - 1,
            c: mergeColIndex + mergeColspan - 1
          }
        });
      });
    }

    console.log('footers:', footers);
    footers.forEach(function (rows) {
      var item = {};
      columns.forEach(function (column, index) {
        item[column.property] = rows[index];
      });
      footList.push(item);
    });
    console.log('footList:', footList);
  }

  var exportMethod = function exportMethod() {
    var workbook = new ExcelJS.Workbook();
    var sheet = workbook.addWorksheet(sheetName);
    workbook.creator = 'vxe-table';
    console.log('sheetCols: ', sheetCols);
    sheet.columns = sheetCols;
    var _columns = columns;

    if (isHeader) {
      colList.forEach(function (list) {
        var _loop = function _loop(key) {
          if (list[key] === null) {
            // eslint-disable-next-line no-prototype-builtins
            if (list.hasOwnProperty(key)) {
              var colItem = columns.find(function (item) {
                return item.property === key;
              }); // console.log('colItem:', colItem)

              list[key] = list[colItem.parentId];
            }
          }
        };

        for (var key in list) {
          _loop(key);
        }
      });
      console.log('colList2:', colList);
      sheet.addRows(colList).forEach(function (excelRow, eIndex) {
        if (useStyle) {
          setExcelRowHeight(excelRow, rowHeight);
        }

        console.log('excelRow:', excelRow);
        excelRow.eachCell(function (excelCell) {
          var excelCol = sheet.getColumn(excelCell.col);

          var column = _columns.find(function (item) {
            return excelCol.key === item.property;
          }); // const column_p = colgroups[eIndex].find((item: any) => column.property.startsWith(item.key))


          var headerAlign = 'center';
          var align = column.align;
          setExcelCellStyle(excelCell, headerAlign || align || allHeaderAlign || allAlign);

          if (useStyle) {
            Object.assign(excelCell, {
              font: {
                bold: true,
                color: {
                  argb: defaultCellFontColor
                }
              },
              fill: {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                  argb: defaultHeaderBackgroundColor
                }
              },
              border: getDefaultBorderStyle()
            });
          }
        });
      });
    }

    sheet.addRows(rowList).forEach(function (excelRow) {
      if (useStyle) {
        setExcelRowHeight(excelRow, rowHeight);
      }

      excelRow.eachCell(function (excelCell) {
        var excelCol = sheet.getColumn(excelCell.col);

        var column = _columns.find(function (item) {
          return item.property === excelCol.key;
        });

        var align = column.align;
        setExcelCellStyle(excelCell, align || allAlign);

        if (useStyle) {
          Object.assign(excelCell, {
            font: {
              color: {
                argb: defaultCellFontColor
              }
            },
            border: getDefaultBorderStyle()
          });
        }
      });
    });

    if (isFooter) {
      sheet.addRows(footList).forEach(function (excelRow) {
        if (useStyle) {
          setExcelRowHeight(excelRow, rowHeight);
        }

        excelRow.eachCell(function (excelCell) {
          var excelCol = sheet.getColumn(excelCell.col);

          var column = _columns.find(function (item) {
            return item.property === excelCol.key;
          });

          var footerAlign = column.footerAlign,
              align = column.align;
          setExcelCellStyle(excelCell, footerAlign || align || allFooterAlign || allAlign);

          if (useStyle) {
            Object.assign(excelCell, {
              font: {
                color: {
                  argb: defaultCellFontColor
                }
              },
              border: getDefaultBorderStyle()
            });
          }
        });
      });
    }

    if (useStyle && sheetMethod) {
      /* eslint-disable-next-line */
      sheetMethod({
        options: options,
        workbook: workbook,
        worksheet: sheet,
        columns: columns,
        colgroups: colgroups,
        datas: datas,
        $table: $table
      });
    }

    sheetMerges.forEach(function (_ref) {
      var s = _ref.s,
          e = _ref.e;
      sheet.mergeCells(s.r + 1, s.c + 1, e.r + 1, e.c + 1);
    });
    workbook.xlsx.writeBuffer().then(function (buffer) {
      /* eslint-disable-next-line */
      var blob = new Blob([buffer], {
        type: 'application/octet-stream'
      }); // 导出 xlsx

      downloadFile(params, blob, options);

      if (showMsg) {
        modal.close(msgKey);
        modal.message({
          message: t('vxe.table.expSuccess'),
          status: 'success'
        });
      }
    });
  };

  if (showMsg) {
    modal.message({
      id: msgKey,
      message: t('vxe.table.expLoading'),
      status: 'loading',
      duration: -1
    });
    setTimeout(exportMethod, 1500);
  } else {
    exportMethod();
  }
}

function downloadFile(params, blob, options) {
  var $table = params.$table;
  var $vxe = $table.$vxe;
  var modal = $vxe.modal,
      t = $vxe.t;
  var message = options.message,
      filename = options.filename,
      type = options.type;
  var showMsg = message !== false;

  if (window.Blob) {
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, "".concat(filename, ".").concat(type));
    } else {
      var linkElem = document.createElement('a');
      linkElem.target = '_blank';
      linkElem.download = "".concat(filename, ".").concat(type);
      linkElem.href = URL.createObjectURL(blob);
      document.body.appendChild(linkElem);
      linkElem.click();
      document.body.removeChild(linkElem);
    }
  } else {
    if (showMsg) {
      modal.alert({
        message: t('vxe.error.notExp'),
        status: 'error'
      });
    }
  }
}

function checkImportData(tableFields, fields) {
  return fields.some(function (field) {
    return tableFields.indexOf(field) > -1;
  });
}

function importError(params) {
  var $table = params.$table,
      options = params.options;
  var $vxe = $table.$vxe,
      _importReject = $table._importReject;
  var showMsg = options.message !== false;
  var modal = $vxe.modal,
      t = $vxe.t;

  if (showMsg) {
    modal.message({
      message: t('vxe.error.impFields'),
      status: 'error'
    });
  }

  if (_importReject) {
    _importReject({
      status: false
    });
  }
}

function importXLSX(params) {
  var $table = params.$table,
      columns = params.columns,
      options = params.options,
      file = params.file;
  var $vxe = $table.$vxe,
      _importResolve = $table._importResolve;
  var modal = $vxe.modal,
      t = $vxe.t;
  var showMsg = options.message !== false;
  var fileReader = new FileReader();

  fileReader.onerror = function () {
    importError(params);
  };

  fileReader.onload = function (evnt) {
    var tableFields = [];
    columns.forEach(function (column) {
      var field = column.property;

      if (field) {
        tableFields.push(field);
      }
    });
    var workbook = new ExcelJS.Workbook();
    var readerTarget = evnt.target;

    if (readerTarget) {
      workbook.xlsx.load(readerTarget.result).then(function (wb) {
        var firstSheet = wb.worksheets[0];

        if (firstSheet) {
          var sheetValues = firstSheet.getSheetValues();

          var fieldIndex = _xeUtils["default"].findIndexOf(sheetValues, function (list) {
            return list && list.length > 0;
          });

          var fields = sheetValues[fieldIndex];
          var status = checkImportData(tableFields, fields);

          if (status) {
            var records = sheetValues.slice(fieldIndex).map(function (list) {
              var item = {};
              list.forEach(function (cellValue, cIndex) {
                item[fields[cIndex]] = cellValue;
              });
              var record = {};
              tableFields.forEach(function (field) {
                record[field] = _xeUtils["default"].isUndefined(item[field]) ? null : item[field];
              });
              return record;
            });
            $table.createData(records).then(function (data) {
              var loadRest;

              if (options.mode === 'insert') {
                loadRest = $table.insertAt(data, -1);
              } else {
                loadRest = $table.reloadData(data);
              }

              return loadRest.then(function () {
                if (_importResolve) {
                  _importResolve({
                    status: true
                  });
                }
              });
            });

            if (showMsg) {
              modal.message({
                message: t('vxe.table.impSuccess', [records.length]),
                status: 'success'
              });
            }
          } else {
            importError(params);
          }
        } else {
          importError(params);
        }
      });
    } else {
      importError(params);
    }
  };

  fileReader.readAsArrayBuffer(file);
}

function handleImportEvent(params) {
  if (params.options.type === 'xlsx') {
    importXLSX(params);
    return false;
  }
}

function handleExportEvent(params) {
  if (params.options.type === 'xlsx') {
    exportXLSX(params);
    return false;
  }
}
/**
 * 基于 vxe-table 表格的增强插件，支持导出 xlsx 格式
 */


var VXETablePluginExportXLSX = {
  install: function install(vxetable) {
    var interceptor = vxetable.interceptor;
    vxetable.setup({
      "export": {
        types: {
          xlsx: 0
        }
      }
    });
    interceptor.mixin({
      'event.import': handleImportEvent,
      'event.export': handleExportEvent
    });
  }
};
exports.VXETablePluginExportXLSX = VXETablePluginExportXLSX;

if (typeof window !== 'undefined' && window.VXETable && window.VXETable.use) {
  window.VXETable.use(VXETablePluginExportXLSX);
}

var _default = VXETablePluginExportXLSX;
exports["default"] = _default;
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIiwiaW5kZXguanMiXSwibmFtZXMiOlsiZGVmYXVsdEhlYWRlckJhY2tncm91bmRDb2xvciIsImRlZmF1bHRDZWxsRm9udENvbG9yIiwiZGVmYXVsdENlbGxCb3JkZXJTdHlsZSIsImRlZmF1bHRDZWxsQm9yZGVyQ29sb3IiLCJnZXRDZWxsTGFiZWwiLCJjb2x1bW4iLCJjZWxsVmFsdWUiLCJjZWxsVHlwZSIsIlhFVXRpbHMiLCJ0b1N0cmluZyIsImlzTmFOIiwiTnVtYmVyIiwibGVuZ3RoIiwiZ2V0Rm9vdGVyRGF0YSIsIm9wdHMiLCJmb290ZXJEYXRhIiwiZm9vdGVyRmlsdGVyTWV0aG9kIiwiZmlsdGVyIiwiaXRlbXMiLCJpbmRleCIsIiRyb3dJbmRleCIsImdldFZhbGlkQ29sdW1uIiwiY2hpbGROb2RlcyIsImlzQ29sR3JvdXAiLCJzZXRFeGNlbFJvd0hlaWdodCIsImV4Y2VsUm93IiwiaGVpZ2h0IiwiZmxvb3IiLCJzZXRFeGNlbENlbGxTdHlsZSIsImV4Y2VsQ2VsbCIsImFsaWduIiwicHJvdGVjdGlvbiIsImxvY2tlZCIsImFsaWdubWVudCIsInZlcnRpY2FsIiwiaG9yaXpvbnRhbCIsImdldERlZmF1bHRCb3JkZXJTdHlsZSIsInRvcCIsInN0eWxlIiwiY29sb3IiLCJhcmdiIiwibGVmdCIsImJvdHRvbSIsInJpZ2h0IiwiZXhwb3J0WExTWCIsInBhcmFtcyIsIm1zZ0tleSIsImNvbnNvbGUiLCJsb2ciLCIkdGFibGUiLCJvcHRpb25zIiwiZGF0YXMiLCJjb2x1bW5zIiwibGFzdFJvd0NvbHVtcyIsImNvbGdyb3VwcyIsInJlYWxDb2xHcm91cHMiLCIkdnhlIiwicm93SGVpZ2h0IiwiYWxsSGVhZGVyQWxpZ24iLCJoZWFkZXJBbGlnbiIsImFsbEFsaWduIiwiYWxsRm9vdGVyQWxpZ24iLCJmb290ZXJBbGlnbiIsIm1vZGFsIiwidCIsIm1lc3NhZ2UiLCJzaGVldE5hbWUiLCJpc0hlYWRlciIsImlzRm9vdGVyIiwiaXNNZXJnZSIsImlzQ29sZ3JvdXAiLCJvcmlnaW5hbCIsInVzZVN0eWxlIiwic2hlZXRNZXRob2QiLCJzaG93TXNnIiwibWVyZ2VDZWxscyIsImdldE1lcmdlQ2VsbHMiLCJjb2xMaXN0IiwiZm9vdExpc3QiLCJzaGVldENvbHMiLCJzaGVldE1lcmdlcyIsImJlZm9yZVJvd0NvdW50IiwiY29sSGVhZCIsImZvckVhY2giLCJwcm9wZXJ0eSIsImtleSIsInJlbmRlcldpZHRoIiwid2lkdGgiLCJ0aXRsZSIsImlkIiwicGFyZW50SWQiLCJwdXNoIiwiTWF0aCIsImNlaWwiLCJlcnJvciIsImNvbHMiLCJySW5kZXgiLCJncm91cEhlYWQiLCJfY29sU3BhbiIsImNvbFNwYW4iLCJfcm93U3BhbiIsInJvd1NwYW4iLCJ2YWxpZENvbHVtbiIsImNvbHVtbkluZGV4IiwiZmluZEluZGV4IiwiaXRlbSIsInN0YXJ0c1dpdGgiLCJzIiwiciIsImMiLCJlIiwibWVyZ2VJdGVtIiwibWVyZ2VSb3dJbmRleCIsInJvdyIsIm1lcmdlUm93c3BhbiIsInJvd3NwYW4iLCJtZXJnZUNvbEluZGV4IiwiY29sIiwibWVyZ2VDb2xzcGFuIiwiY29sc3BhbiIsInJvd0xpc3QiLCJtYXAiLCJyZXN0IiwiX3JvdyIsImdldFRhYmxlRGF0YSIsImZvb3RlcnMiLCJtZXJnZUZvb3Rlckl0ZW1zIiwiZ2V0TWVyZ2VGb290ZXJJdGVtcyIsInJvd3MiLCJleHBvcnRNZXRob2QiLCJ3b3JrYm9vayIsIkV4Y2VsSlMiLCJXb3JrYm9vayIsInNoZWV0IiwiYWRkV29ya3NoZWV0IiwiY3JlYXRvciIsIl9jb2x1bW5zIiwibGlzdCIsImhhc093blByb3BlcnR5IiwiY29sSXRlbSIsImZpbmQiLCJhZGRSb3dzIiwiZUluZGV4IiwiZWFjaENlbGwiLCJleGNlbENvbCIsImdldENvbHVtbiIsIk9iamVjdCIsImFzc2lnbiIsImZvbnQiLCJib2xkIiwiZmlsbCIsInR5cGUiLCJwYXR0ZXJuIiwiZmdDb2xvciIsImJvcmRlciIsIndvcmtzaGVldCIsInhsc3giLCJ3cml0ZUJ1ZmZlciIsInRoZW4iLCJidWZmZXIiLCJibG9iIiwiQmxvYiIsImRvd25sb2FkRmlsZSIsImNsb3NlIiwic3RhdHVzIiwiZHVyYXRpb24iLCJzZXRUaW1lb3V0IiwiZmlsZW5hbWUiLCJ3aW5kb3ciLCJuYXZpZ2F0b3IiLCJtc1NhdmVCbG9iIiwibGlua0VsZW0iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJ0YXJnZXQiLCJkb3dubG9hZCIsImhyZWYiLCJVUkwiLCJjcmVhdGVPYmplY3RVUkwiLCJib2R5IiwiYXBwZW5kQ2hpbGQiLCJjbGljayIsInJlbW92ZUNoaWxkIiwiYWxlcnQiLCJjaGVja0ltcG9ydERhdGEiLCJ0YWJsZUZpZWxkcyIsImZpZWxkcyIsInNvbWUiLCJmaWVsZCIsImluZGV4T2YiLCJpbXBvcnRFcnJvciIsIl9pbXBvcnRSZWplY3QiLCJpbXBvcnRYTFNYIiwiZmlsZSIsIl9pbXBvcnRSZXNvbHZlIiwiZmlsZVJlYWRlciIsIkZpbGVSZWFkZXIiLCJvbmVycm9yIiwib25sb2FkIiwiZXZudCIsInJlYWRlclRhcmdldCIsImxvYWQiLCJyZXN1bHQiLCJ3YiIsImZpcnN0U2hlZXQiLCJ3b3Jrc2hlZXRzIiwic2hlZXRWYWx1ZXMiLCJnZXRTaGVldFZhbHVlcyIsImZpZWxkSW5kZXgiLCJmaW5kSW5kZXhPZiIsInJlY29yZHMiLCJzbGljZSIsImNJbmRleCIsInJlY29yZCIsImlzVW5kZWZpbmVkIiwiY3JlYXRlRGF0YSIsImRhdGEiLCJsb2FkUmVzdCIsIm1vZGUiLCJpbnNlcnRBdCIsInJlbG9hZERhdGEiLCJyZWFkQXNBcnJheUJ1ZmZlciIsImhhbmRsZUltcG9ydEV2ZW50IiwiaGFuZGxlRXhwb3J0RXZlbnQiLCJWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1giLCJpbnN0YWxsIiwidnhldGFibGUiLCJpbnRlcmNlcHRvciIsInNldHVwIiwidHlwZXMiLCJtaXhpbiIsIlZYRVRhYmxlIiwidXNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFVQTs7Ozs7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cm9tICd4ZS11dGlscydcbmltcG9ydCB7XG4gIFZYRVRhYmxlLFxuICBUYWJsZSxcbiAgSW50ZXJjZXB0b3JFeHBvcnRQYXJhbXMsXG4gIEludGVyY2VwdG9ySW1wb3J0UGFyYW1zLFxuICBDb2x1bW5Db25maWcsXG4gIFRhYmxlRXhwb3J0Q29uZmlnLFxuICBDb2x1bW5BbGlnblxufSBmcm9tICd2eGUtdGFibGUnXG5pbXBvcnQgKiBhcyBFeGNlbEpTIGZyb20gJ2V4Y2VsanMnXG5cbmNvbnN0IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3IgPSAnZjhmOGY5J1xuY29uc3QgZGVmYXVsdENlbGxGb250Q29sb3IgPSAnNjA2MjY2J1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJTdHlsZSA9ICd0aGluJ1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJDb2xvciA9ICdlOGVhZWMnXG5cbmZ1bmN0aW9uIGdldENlbGxMYWJlbCAoY29sdW1uOiBDb2x1bW5Db25maWcsIGNlbGxWYWx1ZTogYW55KSB7XG4gIGlmIChjZWxsVmFsdWUpIHtcbiAgICBzd2l0Y2ggKGNvbHVtbi5jZWxsVHlwZSkge1xuICAgICAgY2FzZSAnc3RyaW5nJzpcbiAgICAgICAgcmV0dXJuIFhFVXRpbHMudG9TdHJpbmcoY2VsbFZhbHVlKVxuICAgICAgY2FzZSAnbnVtYmVyJzpcbiAgICAgICAgaWYgKCFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpXG4gICAgICAgIH1cbiAgICAgICAgYnJlYWtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGlmIChjZWxsVmFsdWUubGVuZ3RoIDwgMTIgJiYgIWlzTmFOKGNlbGxWYWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gTnVtYmVyKGNlbGxWYWx1ZSlcbiAgICAgICAgfVxuICAgICAgICBicmVha1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2VsbFZhbHVlXG59XG5cbmZ1bmN0aW9uIGdldEZvb3RlckRhdGEgKG9wdHM6IFRhYmxlRXhwb3J0Q29uZmlnLCBmb290ZXJEYXRhOiBhbnlbXVtdKSB7XG4gIGNvbnN0IHsgZm9vdGVyRmlsdGVyTWV0aG9kIH0gPSBvcHRzXG4gIHJldHVybiBmb290ZXJGaWx0ZXJNZXRob2QgPyBmb290ZXJEYXRhLmZpbHRlcigoaXRlbXMsIGluZGV4KSA9PiBmb290ZXJGaWx0ZXJNZXRob2QoeyBpdGVtcywgJHJvd0luZGV4OiBpbmRleCB9KSkgOiBmb290ZXJEYXRhXG59XG5cbi8vIGZ1bmN0aW9uIGdldEZvb3RlckNlbGxWYWx1ZSAoJHRhYmxlOiBUYWJsZSwgb3B0czogVGFibGVFeHBvcnRDb25maWcsIHJvd3M6IGFueVtdLCBjb2x1bW46IENvbHVtbkNvbmZpZykge1xuLy8gICBjb25zdCBjZWxsVmFsdWUgPSBnZXRDZWxsTGFiZWwoY29sdW1uLCByb3dzWyR0YWJsZS5nZXRWTUNvbHVtbkluZGV4KGNvbHVtbildKVxuLy8gICByZXR1cm4gY2VsbFZhbHVlXG4vLyB9XG5cbmRlY2xhcmUgbW9kdWxlICd2eGUtdGFibGUnIHtcbiAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbiAgaW50ZXJmYWNlIENvbHVtbkluZm8ge1xuICAgIF9yb3c6IGFueTtcbiAgICBfY29sU3BhbjogbnVtYmVyO1xuICAgIF9yb3dTcGFuOiBudW1iZXI7XG4gICAgY2hpbGROb2RlczogQ29sdW1uQ29uZmlnW107XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0VmFsaWRDb2x1bW4gKGNvbHVtbjogQ29sdW1uQ29uZmlnKTogQ29sdW1uQ29uZmlnIHtcbiAgY29uc3QgeyBjaGlsZE5vZGVzIH0gPSBjb2x1bW5cbiAgY29uc3QgaXNDb2xHcm91cCA9IGNoaWxkTm9kZXMgJiYgY2hpbGROb2Rlcy5sZW5ndGhcbiAgaWYgKGlzQ29sR3JvdXApIHtcbiAgICByZXR1cm4gZ2V0VmFsaWRDb2x1bW4oY2hpbGROb2Rlc1swXSlcbiAgfVxuICByZXR1cm4gY29sdW1uXG59XG5cbmZ1bmN0aW9uIHNldEV4Y2VsUm93SGVpZ2h0IChleGNlbFJvdzogRXhjZWxKUy5Sb3csIGhlaWdodDogbnVtYmVyKSB7XG4gIGlmIChoZWlnaHQpIHtcbiAgICBleGNlbFJvdy5oZWlnaHQgPSBYRVV0aWxzLmZsb29yKGhlaWdodCAqIDAuNzUsIDEyKVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldEV4Y2VsQ2VsbFN0eWxlIChleGNlbENlbGw6IEV4Y2VsSlMuQ2VsbCwgYWxpZ24/OiBDb2x1bW5BbGlnbikge1xuICBleGNlbENlbGwucHJvdGVjdGlvbiA9IHtcbiAgICBsb2NrZWQ6IGZhbHNlXG4gIH1cbiAgZXhjZWxDZWxsLmFsaWdubWVudCA9IHtcbiAgICB2ZXJ0aWNhbDogJ21pZGRsZScsXG4gICAgaG9yaXpvbnRhbDogYWxpZ24gfHwgJ2xlZnQnXG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RGVmYXVsdEJvcmRlclN0eWxlICgpIHtcbiAgcmV0dXJuIHtcbiAgICB0b3A6IHtcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgY29sb3I6IHtcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgfVxuICAgIH0sXG4gICAgbGVmdDoge1xuICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICBjb2xvcjoge1xuICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICB9XG4gICAgfSxcbiAgICBib3R0b206IHtcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgY29sb3I6IHtcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgfVxuICAgIH0sXG4gICAgcmlnaHQ6IHtcbiAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgY29sb3I6IHtcbiAgICAgICAgYXJnYjogZGVmYXVsdENlbGxCb3JkZXJDb2xvclxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleHBvcnRYTFNYIChwYXJhbXM6IEludGVyY2VwdG9yRXhwb3J0UGFyYW1zKSB7XG4gIGNvbnN0IG1zZ0tleSA9ICd4bHN4J1xuICBjb25zb2xlLmxvZygncGFyYW1zOicsIHBhcmFtcylcbiAgY29uc3QgeyAkdGFibGUsIG9wdGlvbnMsIC8qIGNvbHVtbnMsIGNvbGdyb3VwcywgKi8gZGF0YXMgfSA9IHBhcmFtc1xuICBjb25zdCBjb2x1bW5zID0gcGFyYW1zLm9wdGlvbnMubGFzdFJvd0NvbHVtc1xuICBjb25zdCBjb2xncm91cHMgPSBwYXJhbXMub3B0aW9ucy5yZWFsQ29sR3JvdXBzXG4gIGNvbnN0IHsgJHZ4ZSwgcm93SGVpZ2h0LCBoZWFkZXJBbGlnbjogYWxsSGVhZGVyQWxpZ24sIGFsaWduOiBhbGxBbGlnbiwgZm9vdGVyQWxpZ246IGFsbEZvb3RlckFsaWduIH0gPSAkdGFibGVcbiAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZVxuICBjb25zdCB7IG1lc3NhZ2UsIHNoZWV0TmFtZSwgaXNIZWFkZXIsIGlzRm9vdGVyLCBpc01lcmdlLCBpc0NvbGdyb3VwLCBvcmlnaW5hbCwgdXNlU3R5bGUsIHNoZWV0TWV0aG9kIH0gPSBvcHRpb25zXG4gIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZVxuICBjb25zdCBtZXJnZUNlbGxzID0gJHRhYmxlLmdldE1lcmdlQ2VsbHMoKVxuICBjb25zdCBjb2xMaXN0OiBhbnlbXSA9IFtdXG4gIGNvbnN0IGZvb3RMaXN0OiBhbnlbXSA9IFtdXG4gIGNvbnN0IHNoZWV0Q29sczogYW55W10gPSBbXVxuICBjb25zdCBzaGVldE1lcmdlczogeyBzOiB7IHI6IG51bWJlciwgYzogbnVtYmVyIH0sIGU6IHsgcjogbnVtYmVyLCBjOiBudW1iZXIgfSB9W10gPSBbXVxuICBsZXQgYmVmb3JlUm93Q291bnQgPSAwXG4gIGNvbnN0IGNvbEhlYWQ6IGFueSA9IHt9XG4gIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uOiBhbnkpID0+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyBwcm9wZXJ0eS8qICwgcmVuZGVyV2lkdGggKi8gfSA9IGNvbHVtblxuICAgICAgY29uc3Qga2V5ID0gY29sdW1uLnByb3BlcnR5XG4gICAgICBjb25zdCByZW5kZXJXaWR0aCA9IGNvbHVtbi53aWR0aFxuICAgICAgY29sSGVhZFtrZXldID0gb3JpZ2luYWwgPyBwcm9wZXJ0eSA6IGNvbHVtbi50aXRsZVxuICAgICAgY29sdW1uLmlkID0gY29sdW1uLnByb3BlcnR5XG4gICAgICBjb2x1bW4ucGFyZW50SWQgPSBjb2x1bW4ucGFyYW1zLnBhcmVudElkXG4gICAgICBzaGVldENvbHMucHVzaCh7XG4gICAgICAgIGtleToga2V5LFxuICAgICAgICB3aWR0aDogTWF0aC5jZWlsKHJlbmRlcldpZHRoIC8gOClcbiAgICAgIH0pXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnNvbGUubG9nKGVycm9yKVxuICAgIH1cbiAgfSlcbiAgY29uc29sZS5sb2coJ2NvbHVtbnM6JywgY29sdW1ucylcbiAgLy8g5aSE55CG6KGo5aS0XG4gIGlmIChpc0hlYWRlcikge1xuICAgIC8vIOWkhOeQhuWIhue7hFxuICAgIGlmIChpc0NvbGdyb3VwICYmICFvcmlnaW5hbCAmJiBjb2xncm91cHMpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdjb2xncm91cHM6JywgY29sZ3JvdXBzKVxuICAgICAgY29sZ3JvdXBzLmZvckVhY2goKGNvbHM6IGFueSwgckluZGV4OiBhbnkpID0+IHtcbiAgICAgICAgY29uc3QgZ3JvdXBIZWFkOiBhbnkgPSB7fVxuICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbjogYW55KSA9PiB7XG4gICAgICAgICAgZ3JvdXBIZWFkW2NvbHVtbi5wcm9wZXJ0eV0gPSBudWxsXG4gICAgICAgIH0pXG4gICAgICAgIGNvbHMuZm9yRWFjaCgoY29sdW1uOiBhbnkpID0+IHtcbiAgICAgICAgICBjb2x1bW4uaWQgPSBjb2x1bW4ucHJvcGVydHlcbiAgICAgICAgICBjb2x1bW4ucGFyZW50SWQgPSBjb2x1bW4ucGFyYW1zLnBhcmVudElkXG4gICAgICAgICAgLy8gY29uc3QgeyBfY29sU3BhbiwgX3Jvd1NwYW4gfSA9IGNvbHVtblxuICAgICAgICAgIGNvbnN0IF9jb2xTcGFuID0gY29sdW1uLmNvbFNwYW5cbiAgICAgICAgICBjb25zdCBfcm93U3BhbiA9IGNvbHVtbi5yb3dTcGFuXG4gICAgICAgICAgY29uc3QgdmFsaWRDb2x1bW4gPSBnZXRWYWxpZENvbHVtbihjb2x1bW4pXG4gICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBjb2x1bW5zLmZpbmRJbmRleCgoaXRlbTogYW55KSA9PiBpdGVtLmtleS5zdGFydHNXaXRoKHZhbGlkQ29sdW1uLmtleSkpXG4gICAgICAgICAgZ3JvdXBIZWFkW3ZhbGlkQ29sdW1uLnByb3BlcnR5XSA9IG9yaWdpbmFsID8gdmFsaWRDb2x1bW4ucHJvcGVydHkgOiBjb2x1bW4udGl0bGVcbiAgICAgICAgICBpZiAoX2NvbFNwYW4gPiAxIHx8IF9yb3dTcGFuID4gMSkge1xuICAgICAgICAgICAgc2hlZXRNZXJnZXMucHVzaCh7XG4gICAgICAgICAgICAgIHM6IHsgcjogckluZGV4LCBjOiBjb2x1bW5JbmRleCB9LFxuICAgICAgICAgICAgICBlOiB7IHI6IHJJbmRleCArIF9yb3dTcGFuIC0gMSwgYzogY29sdW1uSW5kZXggKyBfY29sU3BhbiAtIDEgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICAgIGNvbExpc3QucHVzaChncm91cEhlYWQpXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICBjb2xMaXN0LnB1c2goY29sSGVhZClcbiAgICB9XG4gICAgYmVmb3JlUm93Q291bnQgKz0gY29sTGlzdC5sZW5ndGhcbiAgICBjb25zb2xlLmxvZygnY29sTGlzdDonLCBjb2xMaXN0KVxuICB9XG4gIC8vIOWkhOeQhuWQiOW5tlxuICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICBtZXJnZUNlbGxzLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcbiAgICAgIGNvbnN0IHsgcm93OiBtZXJnZVJvd0luZGV4LCByb3dzcGFuOiBtZXJnZVJvd3NwYW4sIGNvbDogbWVyZ2VDb2xJbmRleCwgY29sc3BhbjogbWVyZ2VDb2xzcGFuIH0gPSBtZXJnZUl0ZW1cbiAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxuICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgIH0pXG4gICAgfSlcbiAgfVxuICBjb25zdCByb3dMaXN0ID0gZGF0YXMubWFwKGl0ZW0gPT4ge1xuICAgIGNvbnN0IHJlc3Q6IGFueSA9IHt9XG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW46IGFueSkgPT4ge1xuICAgICAgcmVzdFtjb2x1bW4ucHJvcGVydHldID0gZ2V0Q2VsbExhYmVsKGNvbHVtbiwgaXRlbS5fcm93W2NvbHVtbi5wcm9wZXJ0eV0pXG4gICAgICBjb2x1bW4uaWQgPSBjb2x1bW4ucHJvcGVydHlcbiAgICB9KVxuICAgIHJldHVybiByZXN0XG4gIH0pXG4gIGNvbnNvbGUubG9nKCdyb3dMaXN0OicsIHJvd0xpc3QpXG4gIGJlZm9yZVJvd0NvdW50ICs9IHJvd0xpc3QubGVuZ3RoXG4gIC8vIOWkhOeQhuihqOWwvlxuICBpZiAoaXNGb290ZXIpIHtcbiAgICBjb25zdCB7IGZvb3RlckRhdGEgfSA9ICR0YWJsZS5nZXRUYWJsZURhdGEoKVxuICAgIGNvbnN0IGZvb3RlcnMgPSBnZXRGb290ZXJEYXRhKG9wdGlvbnMsIGZvb3RlckRhdGEpXG4gICAgY29uc3QgbWVyZ2VGb290ZXJJdGVtcyA9ICR0YWJsZS5nZXRNZXJnZUZvb3Rlckl0ZW1zKClcbiAgICAvLyDlpITnkIblkIjlubZcbiAgICBpZiAoaXNNZXJnZSAmJiAhb3JpZ2luYWwpIHtcbiAgICAgIG1lcmdlRm9vdGVySXRlbXMuZm9yRWFjaChtZXJnZUl0ZW0gPT4ge1xuICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtXG4gICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgIHM6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50LCBjOiBtZXJnZUNvbEluZGV4IH0sXG4gICAgICAgICAgZTogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQgKyBtZXJnZVJvd3NwYW4gLSAxLCBjOiBtZXJnZUNvbEluZGV4ICsgbWVyZ2VDb2xzcGFuIC0gMSB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgICBjb25zb2xlLmxvZygnZm9vdGVyczonLCBmb290ZXJzKVxuICAgIGZvb3RlcnMuZm9yRWFjaCgocm93cykgPT4ge1xuICAgICAgY29uc3QgaXRlbTogYW55ID0ge31cbiAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uOiBhbnksIGluZGV4OiBudW1iZXIpID0+IHtcbiAgICAgICAgaXRlbVtjb2x1bW4ucHJvcGVydHldID0gcm93c1tpbmRleF1cbiAgICAgIH0pXG4gICAgICBmb290TGlzdC5wdXNoKGl0ZW0pXG4gICAgfSlcbiAgICBjb25zb2xlLmxvZygnZm9vdExpc3Q6JywgZm9vdExpc3QpXG4gIH1cbiAgY29uc3QgZXhwb3J0TWV0aG9kID0gKCkgPT4ge1xuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxuICAgIGNvbnN0IHNoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KHNoZWV0TmFtZSlcbiAgICB3b3JrYm9vay5jcmVhdG9yID0gJ3Z4ZS10YWJsZSdcbiAgICBjb25zb2xlLmxvZygnc2hlZXRDb2xzOiAnLCBzaGVldENvbHMpXG4gICAgc2hlZXQuY29sdW1ucyA9IHNoZWV0Q29sc1xuICAgIGNvbnN0IF9jb2x1bW5zID0gY29sdW1uc1xuICAgIGlmIChpc0hlYWRlcikge1xuICAgICAgY29sTGlzdC5mb3JFYWNoKGxpc3QgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBsaXN0KSB7XG4gICAgICAgICAgaWYgKGxpc3Rba2V5XSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXByb3RvdHlwZS1idWlsdGluc1xuICAgICAgICAgICAgaWYgKGxpc3QuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICBjb25zdCBjb2xJdGVtID0gY29sdW1ucy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0ucHJvcGVydHkgPT09IGtleSlcbiAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2NvbEl0ZW06JywgY29sSXRlbSlcbiAgICAgICAgICAgICAgbGlzdFtrZXldID0gbGlzdFtjb2xJdGVtLnBhcmVudElkXVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIGNvbnNvbGUubG9nKCdjb2xMaXN0MjonLCBjb2xMaXN0KVxuICAgICAgc2hlZXQuYWRkUm93cyhjb2xMaXN0KS5mb3JFYWNoKChleGNlbFJvdywgZUluZGV4KSA9PiB7XG4gICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpXG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ2V4Y2VsUm93OicsIGV4Y2VsUm93KVxuICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpXG4gICAgICAgICAgY29uc3QgY29sdW1uOiBhbnkgPSBfY29sdW1ucy5maW5kKChpdGVtOiBhbnkpID0+IGV4Y2VsQ29sLmtleSA9PT0gaXRlbS5wcm9wZXJ0eSlcbiAgICAgICAgICAvLyBjb25zdCBjb2x1bW5fcCA9IGNvbGdyb3Vwc1tlSW5kZXhdLmZpbmQoKGl0ZW06IGFueSkgPT4gY29sdW1uLnByb3BlcnR5LnN0YXJ0c1dpdGgoaXRlbS5rZXkpKVxuICAgICAgICAgIGNvbnN0IGhlYWRlckFsaWduID0gJ2NlbnRlcidcbiAgICAgICAgICBjb25zdCB7IC8qIGhlYWRlckFsaWduLCAqLyBhbGlnbiB9ID0gY29sdW1uXG4gICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBoZWFkZXJBbGlnbiB8fCBhbGlnbiB8fCBhbGxIZWFkZXJBbGlnbiB8fCBhbGxBbGlnbilcbiAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICBib2xkOiB0cnVlLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEZvbnRDb2xvclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgZmlsbDoge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdwYXR0ZXJuJyxcbiAgICAgICAgICAgICAgICBwYXR0ZXJuOiAnc29saWQnLFxuICAgICAgICAgICAgICAgIGZnQ29sb3I6IHtcbiAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRIZWFkZXJCYWNrZ3JvdW5kQ29sb3JcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gICAgc2hlZXQuYWRkUm93cyhyb3dMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcbiAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KVxuICAgICAgfVxuICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcbiAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbClcbiAgICAgICAgY29uc3QgY29sdW1uOiBhbnkgPSBfY29sdW1ucy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0ucHJvcGVydHkgPT09IGV4Y2VsQ29sLmtleSlcbiAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uXG4gICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24gfHwgYWxsQWxpZ24pXG4gICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICBmb250OiB7XG4gICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0pXG4gICAgaWYgKGlzRm9vdGVyKSB7XG4gICAgICBzaGVldC5hZGRSb3dzKGZvb3RMaXN0KS5mb3JFYWNoKGV4Y2VsUm93ID0+IHtcbiAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodClcbiAgICAgICAgfVxuICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpXG4gICAgICAgICAgY29uc3QgY29sdW1uOiBhbnkgPSBfY29sdW1ucy5maW5kKChpdGVtOiBhbnkpID0+IGl0ZW0ucHJvcGVydHkgPT09IGV4Y2VsQ29sLmtleSlcbiAgICAgICAgICBjb25zdCB7IGZvb3RlckFsaWduLCBhbGlnbiB9ID0gY29sdW1uXG4gICAgICAgICAgc2V0RXhjZWxDZWxsU3R5bGUoZXhjZWxDZWxsLCBmb290ZXJBbGlnbiB8fCBhbGlnbiB8fCBhbGxGb290ZXJBbGlnbiB8fCBhbGxBbGlnbilcbiAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gICAgaWYgKHVzZVN0eWxlICYmIHNoZWV0TWV0aG9kKSB7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgKi9cbiAgICAgIHNoZWV0TWV0aG9kKHsgb3B0aW9ucywgd29ya2Jvb2ssIHdvcmtzaGVldDogc2hlZXQsIGNvbHVtbnMsIGNvbGdyb3VwcywgZGF0YXMsICR0YWJsZSB9KVxuICAgIH1cbiAgICBzaGVldE1lcmdlcy5mb3JFYWNoKCh7IHMsIGUgfSkgPT4ge1xuICAgICAgc2hlZXQubWVyZ2VDZWxscyhzLnIgKyAxLCBzLmMgKyAxLCBlLnIgKyAxLCBlLmMgKyAxKVxuICAgIH0pXG4gICAgd29ya2Jvb2sueGxzeC53cml0ZUJ1ZmZlcigpLnRoZW4oYnVmZmVyID0+IHtcbiAgICAgIC8qIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSAqL1xuICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbYnVmZmVyXSwgeyB0eXBlOiAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyB9KVxuICAgICAgLy8g5a+85Ye6IHhsc3hcbiAgICAgIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpXG4gICAgICBpZiAoc2hvd01zZykge1xuICAgICAgICBtb2RhbC5jbG9zZShtc2dLZXkpXG4gICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBtZXNzYWdlOiB0KCd2eGUudGFibGUuZXhwU3VjY2VzcycpLCBzdGF0dXM6ICdzdWNjZXNzJyB9KVxuICAgICAgfVxuICAgIH0pXG4gIH1cbiAgaWYgKHNob3dNc2cpIHtcbiAgICBtb2RhbC5tZXNzYWdlKHsgaWQ6IG1zZ0tleSwgbWVzc2FnZTogdCgndnhlLnRhYmxlLmV4cExvYWRpbmcnKSwgc3RhdHVzOiAnbG9hZGluZycsIGR1cmF0aW9uOiAtMSB9KVxuICAgIHNldFRpbWVvdXQoZXhwb3J0TWV0aG9kLCAxNTAwKVxuICB9IGVsc2Uge1xuICAgIGV4cG9ydE1ldGhvZCgpXG4gIH1cbn1cblxuZnVuY3Rpb24gZG93bmxvYWRGaWxlIChwYXJhbXM6IEludGVyY2VwdG9yRXhwb3J0UGFyYW1zLCBibG9iOiBCbG9iLCBvcHRpb25zOiBUYWJsZUV4cG9ydENvbmZpZykge1xuICBjb25zdCB7ICR0YWJsZSB9ID0gcGFyYW1zXG4gIGNvbnN0IHsgJHZ4ZSB9ID0gJHRhYmxlXG4gIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGVcbiAgY29uc3QgeyBtZXNzYWdlLCBmaWxlbmFtZSwgdHlwZSB9ID0gb3B0aW9uc1xuICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2VcbiAgaWYgKHdpbmRvdy5CbG9iKSB7XG4gICAgaWYgKG5hdmlnYXRvci5tc1NhdmVCbG9iKSB7XG4gICAgICBuYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxpbmtFbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gICAgICBsaW5rRWxlbS50YXJnZXQgPSAnX2JsYW5rJ1xuICAgICAgbGlua0VsZW0uZG93bmxvYWQgPSBgJHtmaWxlbmFtZX0uJHt0eXBlfWBcbiAgICAgIGxpbmtFbGVtLmhyZWYgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmtFbGVtKVxuICAgICAgbGlua0VsZW0uY2xpY2soKVxuICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChsaW5rRWxlbSlcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgaWYgKHNob3dNc2cpIHtcbiAgICAgIG1vZGFsLmFsZXJ0KHsgbWVzc2FnZTogdCgndnhlLmVycm9yLm5vdEV4cCcpLCBzdGF0dXM6ICdlcnJvcicgfSlcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2hlY2tJbXBvcnREYXRhICh0YWJsZUZpZWxkczogc3RyaW5nW10sIGZpZWxkczogc3RyaW5nW10pIHtcbiAgcmV0dXJuIGZpZWxkcy5zb21lKGZpZWxkID0+IHRhYmxlRmllbGRzLmluZGV4T2YoZmllbGQpID4gLTEpXG59XG5cbmRlY2xhcmUgbW9kdWxlICd2eGUtdGFibGUnIHtcbiAgLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbiAgaW50ZXJmYWNlIFRhYmxlIHtcbiAgICBfaW1wb3J0UmVzb2x2ZT86IEZ1bmN0aW9uIHwgbnVsbDtcbiAgICBfaW1wb3J0UmVqZWN0PzogRnVuY3Rpb24gfCBudWxsO1xuICB9XG59XG5mdW5jdGlvbiBpbXBvcnRFcnJvciAocGFyYW1zOiBJbnRlcmNlcHRvckltcG9ydFBhcmFtcykge1xuICBjb25zdCB7ICR0YWJsZSwgb3B0aW9ucyB9ID0gcGFyYW1zXG4gIGNvbnN0IHsgJHZ4ZSwgX2ltcG9ydFJlamVjdCB9ID0gJHRhYmxlXG4gIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlXG4gIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGVcbiAgaWYgKHNob3dNc2cpIHtcbiAgICBtb2RhbC5tZXNzYWdlKHsgbWVzc2FnZTogdCgndnhlLmVycm9yLmltcEZpZWxkcycpLCBzdGF0dXM6ICdlcnJvcicgfSlcbiAgfVxuICBpZiAoX2ltcG9ydFJlamVjdCkge1xuICAgIF9pbXBvcnRSZWplY3QoeyBzdGF0dXM6IGZhbHNlIH0pXG4gIH1cbn1cblxuZnVuY3Rpb24gaW1wb3J0WExTWCAocGFyYW1zOiBJbnRlcmNlcHRvckltcG9ydFBhcmFtcykge1xuICBjb25zdCB7ICR0YWJsZSwgY29sdW1ucywgb3B0aW9ucywgZmlsZSB9ID0gcGFyYW1zXG4gIGNvbnN0IHsgJHZ4ZSwgX2ltcG9ydFJlc29sdmUgfSA9ICR0YWJsZVxuICBjb25zdCB7IG1vZGFsLCB0IH0gPSAkdnhlXG4gIGNvbnN0IHNob3dNc2cgPSBvcHRpb25zLm1lc3NhZ2UgIT09IGZhbHNlXG4gIGNvbnN0IGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gIGZpbGVSZWFkZXIub25lcnJvciA9ICgpID0+IHtcbiAgICBpbXBvcnRFcnJvcihwYXJhbXMpXG4gIH1cbiAgZmlsZVJlYWRlci5vbmxvYWQgPSAoZXZudCkgPT4ge1xuICAgIGNvbnN0IHRhYmxlRmllbGRzOiBzdHJpbmdbXSA9IFtdXG4gICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgIGNvbnN0IGZpZWxkID0gY29sdW1uLnByb3BlcnR5XG4gICAgICBpZiAoZmllbGQpIHtcbiAgICAgICAgdGFibGVGaWVsZHMucHVzaChmaWVsZClcbiAgICAgIH1cbiAgICB9KVxuICAgIGNvbnN0IHdvcmtib29rID0gbmV3IEV4Y2VsSlMuV29ya2Jvb2soKVxuICAgIGNvbnN0IHJlYWRlclRhcmdldCA9IGV2bnQudGFyZ2V0XG4gICAgaWYgKHJlYWRlclRhcmdldCkge1xuICAgICAgd29ya2Jvb2sueGxzeC5sb2FkKHJlYWRlclRhcmdldC5yZXN1bHQgYXMgQXJyYXlCdWZmZXIpLnRoZW4od2IgPT4ge1xuICAgICAgICBjb25zdCBmaXJzdFNoZWV0ID0gd2Iud29ya3NoZWV0c1swXVxuICAgICAgICBpZiAoZmlyc3RTaGVldCkge1xuICAgICAgICAgIGNvbnN0IHNoZWV0VmFsdWVzID0gZmlyc3RTaGVldC5nZXRTaGVldFZhbHVlcygpIGFzIHN0cmluZ1tdW11cbiAgICAgICAgICBjb25zdCBmaWVsZEluZGV4ID0gWEVVdGlscy5maW5kSW5kZXhPZihzaGVldFZhbHVlcywgKGxpc3QpID0+IGxpc3QgJiYgbGlzdC5sZW5ndGggPiAwKVxuICAgICAgICAgIGNvbnN0IGZpZWxkcyA9IHNoZWV0VmFsdWVzW2ZpZWxkSW5kZXhdIGFzIHN0cmluZ1tdXG4gICAgICAgICAgY29uc3Qgc3RhdHVzID0gY2hlY2tJbXBvcnREYXRhKHRhYmxlRmllbGRzLCBmaWVsZHMpXG4gICAgICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IHNoZWV0VmFsdWVzLnNsaWNlKGZpZWxkSW5kZXgpLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgaXRlbSA6IGFueSA9IHt9XG4gICAgICAgICAgICAgIGxpc3QuZm9yRWFjaCgoY2VsbFZhbHVlLCBjSW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBpdGVtW2ZpZWxkc1tjSW5kZXhdXSA9IGNlbGxWYWx1ZVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBjb25zdCByZWNvcmQ6IGFueSA9IHt9XG4gICAgICAgICAgICAgIHRhYmxlRmllbGRzLmZvckVhY2goZmllbGQgPT4ge1xuICAgICAgICAgICAgICAgIHJlY29yZFtmaWVsZF0gPSBYRVV0aWxzLmlzVW5kZWZpbmVkKGl0ZW1bZmllbGRdKSA/IG51bGwgOiBpdGVtW2ZpZWxkXVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICByZXR1cm4gcmVjb3JkXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgJHRhYmxlLmNyZWF0ZURhdGEocmVjb3JkcylcbiAgICAgICAgICAgICAgLnRoZW4oKGRhdGE6IGFueVtdKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGxvYWRSZXN0OiBQcm9taXNlPGFueT5cbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5tb2RlID09PSAnaW5zZXJ0Jykge1xuICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUuaW5zZXJ0QXQoZGF0YSwgLTEpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIGxvYWRSZXN0ID0gJHRhYmxlLnJlbG9hZERhdGEoZGF0YSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRSZXN0LnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgaWYgKF9pbXBvcnRSZXNvbHZlKSB7XG4gICAgICAgICAgICAgICAgICAgIF9pbXBvcnRSZXNvbHZlKHsgc3RhdHVzOiB0cnVlIH0pXG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIGlmIChzaG93TXNnKSB7XG4gICAgICAgICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBtZXNzYWdlOiB0KCd2eGUudGFibGUuaW1wU3VjY2VzcycsIFtyZWNvcmRzLmxlbmd0aF0pLCBzdGF0dXM6ICdzdWNjZXNzJyB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpbXBvcnRFcnJvcihwYXJhbXMpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKVxuICAgIH1cbiAgfVxuICBmaWxlUmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpXG59XG5cbmZ1bmN0aW9uIGhhbmRsZUltcG9ydEV2ZW50IChwYXJhbXM6IEludGVyY2VwdG9ySW1wb3J0UGFyYW1zKSB7XG4gIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcbiAgICBpbXBvcnRYTFNYKHBhcmFtcylcbiAgICByZXR1cm4gZmFsc2VcbiAgfVxufVxuXG5mdW5jdGlvbiBoYW5kbGVFeHBvcnRFdmVudCAocGFyYW1zOiBJbnRlcmNlcHRvckV4cG9ydFBhcmFtcykge1xuICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XG4gICAgZXhwb3J0WExTWChwYXJhbXMpXG4gICAgcmV0dXJuIGZhbHNlXG4gIH1cbn1cblxuLyoqXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOaUr+aMgeWvvOWHuiB4bHN4IOagvOW8j1xuICovXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYID0ge1xuICBpbnN0YWxsICh2eGV0YWJsZTogdHlwZW9mIFZYRVRhYmxlKSB7XG4gICAgY29uc3QgeyBpbnRlcmNlcHRvciB9ID0gdnhldGFibGVcbiAgICB2eGV0YWJsZS5zZXR1cCh7XG4gICAgICBleHBvcnQ6IHtcbiAgICAgICAgdHlwZXM6IHtcbiAgICAgICAgICB4bHN4OiAwXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICAgIGludGVyY2VwdG9yLm1peGluKHtcbiAgICAgICdldmVudC5pbXBvcnQnOiBoYW5kbGVJbXBvcnRFdmVudCxcbiAgICAgICdldmVudC5leHBvcnQnOiBoYW5kbGVFeHBvcnRFdmVudFxuICAgIH0pXG4gIH1cbn1cblxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5WWEVUYWJsZSAmJiB3aW5kb3cuVlhFVGFibGUudXNlKSB7XG4gIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYKVxufVxuXG5leHBvcnQgZGVmYXVsdCBWWEVUYWJsZVBsdWdpbkV4cG9ydFhMU1hcbiIsImltcG9ydCBYRVV0aWxzIGZyb20gJ3hlLXV0aWxzJztcbmltcG9ydCAqIGFzIEV4Y2VsSlMgZnJvbSAnZXhjZWxqcyc7XG5jb25zdCBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yID0gJ2Y4ZjhmOSc7XG5jb25zdCBkZWZhdWx0Q2VsbEZvbnRDb2xvciA9ICc2MDYyNjYnO1xuY29uc3QgZGVmYXVsdENlbGxCb3JkZXJTdHlsZSA9ICd0aGluJztcbmNvbnN0IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3IgPSAnZThlYWVjJztcbmZ1bmN0aW9uIGdldENlbGxMYWJlbChjb2x1bW4sIGNlbGxWYWx1ZSkge1xuICAgIGlmIChjZWxsVmFsdWUpIHtcbiAgICAgICAgc3dpdGNoIChjb2x1bW4uY2VsbFR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3N0cmluZyc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFhFVXRpbHMudG9TdHJpbmcoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgaWYgKCFpc05hTihjZWxsVmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBOdW1iZXIoY2VsbFZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGlmIChjZWxsVmFsdWUubGVuZ3RoIDwgMTIgJiYgIWlzTmFOKGNlbGxWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE51bWJlcihjZWxsVmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gY2VsbFZhbHVlO1xufVxuZnVuY3Rpb24gZ2V0Rm9vdGVyRGF0YShvcHRzLCBmb290ZXJEYXRhKSB7XG4gICAgY29uc3QgeyBmb290ZXJGaWx0ZXJNZXRob2QgfSA9IG9wdHM7XG4gICAgcmV0dXJuIGZvb3RlckZpbHRlck1ldGhvZCA/IGZvb3RlckRhdGEuZmlsdGVyKChpdGVtcywgaW5kZXgpID0+IGZvb3RlckZpbHRlck1ldGhvZCh7IGl0ZW1zLCAkcm93SW5kZXg6IGluZGV4IH0pKSA6IGZvb3RlckRhdGE7XG59XG5mdW5jdGlvbiBnZXRWYWxpZENvbHVtbihjb2x1bW4pIHtcbiAgICBjb25zdCB7IGNoaWxkTm9kZXMgfSA9IGNvbHVtbjtcbiAgICBjb25zdCBpc0NvbEdyb3VwID0gY2hpbGROb2RlcyAmJiBjaGlsZE5vZGVzLmxlbmd0aDtcbiAgICBpZiAoaXNDb2xHcm91cCkge1xuICAgICAgICByZXR1cm4gZ2V0VmFsaWRDb2x1bW4oY2hpbGROb2Rlc1swXSk7XG4gICAgfVxuICAgIHJldHVybiBjb2x1bW47XG59XG5mdW5jdGlvbiBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgaGVpZ2h0KSB7XG4gICAgaWYgKGhlaWdodCkge1xuICAgICAgICBleGNlbFJvdy5oZWlnaHQgPSBYRVV0aWxzLmZsb29yKGhlaWdodCAqIDAuNzUsIDEyKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGFsaWduKSB7XG4gICAgZXhjZWxDZWxsLnByb3RlY3Rpb24gPSB7XG4gICAgICAgIGxvY2tlZDogZmFsc2VcbiAgICB9O1xuICAgIGV4Y2VsQ2VsbC5hbGlnbm1lbnQgPSB7XG4gICAgICAgIHZlcnRpY2FsOiAnbWlkZGxlJyxcbiAgICAgICAgaG9yaXpvbnRhbDogYWxpZ24gfHwgJ2xlZnQnXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGdldERlZmF1bHRCb3JkZXJTdHlsZSgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB0b3A6IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGxlZnQ6IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGJvdHRvbToge1xuICAgICAgICAgICAgc3R5bGU6IGRlZmF1bHRDZWxsQm9yZGVyU3R5bGUsXG4gICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsQm9yZGVyQ29sb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmlnaHQ6IHtcbiAgICAgICAgICAgIHN0eWxlOiBkZWZhdWx0Q2VsbEJvcmRlclN0eWxlLFxuICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0Q2VsbEJvcmRlckNvbG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gZXhwb3J0WExTWChwYXJhbXMpIHtcbiAgICBjb25zdCBtc2dLZXkgPSAneGxzeCc7XG4gICAgY29uc29sZS5sb2coJ3BhcmFtczonLCBwYXJhbXMpO1xuICAgIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zLCAvKiBjb2x1bW5zLCBjb2xncm91cHMsICovIGRhdGFzIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgY29sdW1ucyA9IHBhcmFtcy5vcHRpb25zLmxhc3RSb3dDb2x1bXM7XG4gICAgY29uc3QgY29sZ3JvdXBzID0gcGFyYW1zLm9wdGlvbnMucmVhbENvbEdyb3VwcztcbiAgICBjb25zdCB7ICR2eGUsIHJvd0hlaWdodCwgaGVhZGVyQWxpZ246IGFsbEhlYWRlckFsaWduLCBhbGlnbjogYWxsQWxpZ24sIGZvb3RlckFsaWduOiBhbGxGb290ZXJBbGlnbiB9ID0gJHRhYmxlO1xuICAgIGNvbnN0IHsgbW9kYWwsIHQgfSA9ICR2eGU7XG4gICAgY29uc3QgeyBtZXNzYWdlLCBzaGVldE5hbWUsIGlzSGVhZGVyLCBpc0Zvb3RlciwgaXNNZXJnZSwgaXNDb2xncm91cCwgb3JpZ2luYWwsIHVzZVN0eWxlLCBzaGVldE1ldGhvZCB9ID0gb3B0aW9ucztcbiAgICBjb25zdCBzaG93TXNnID0gbWVzc2FnZSAhPT0gZmFsc2U7XG4gICAgY29uc3QgbWVyZ2VDZWxscyA9ICR0YWJsZS5nZXRNZXJnZUNlbGxzKCk7XG4gICAgY29uc3QgY29sTGlzdCA9IFtdO1xuICAgIGNvbnN0IGZvb3RMaXN0ID0gW107XG4gICAgY29uc3Qgc2hlZXRDb2xzID0gW107XG4gICAgY29uc3Qgc2hlZXRNZXJnZXMgPSBbXTtcbiAgICBsZXQgYmVmb3JlUm93Q291bnQgPSAwO1xuICAgIGNvbnN0IGNvbEhlYWQgPSB7fTtcbiAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgeyBwcm9wZXJ0eSAvKiAsIHJlbmRlcldpZHRoICovIH0gPSBjb2x1bW47XG4gICAgICAgICAgICBjb25zdCBrZXkgPSBjb2x1bW4ucHJvcGVydHk7XG4gICAgICAgICAgICBjb25zdCByZW5kZXJXaWR0aCA9IGNvbHVtbi53aWR0aDtcbiAgICAgICAgICAgIGNvbEhlYWRba2V5XSA9IG9yaWdpbmFsID8gcHJvcGVydHkgOiBjb2x1bW4udGl0bGU7XG4gICAgICAgICAgICBjb2x1bW4uaWQgPSBjb2x1bW4ucHJvcGVydHk7XG4gICAgICAgICAgICBjb2x1bW4ucGFyZW50SWQgPSBjb2x1bW4ucGFyYW1zLnBhcmVudElkO1xuICAgICAgICAgICAgc2hlZXRDb2xzLnB1c2goe1xuICAgICAgICAgICAgICAgIGtleToga2V5LFxuICAgICAgICAgICAgICAgIHdpZHRoOiBNYXRoLmNlaWwocmVuZGVyV2lkdGggLyA4KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zb2xlLmxvZygnY29sdW1uczonLCBjb2x1bW5zKTtcbiAgICAvLyDlpITnkIbooajlpLRcbiAgICBpZiAoaXNIZWFkZXIpIHtcbiAgICAgICAgLy8g5aSE55CG5YiG57uEXG4gICAgICAgIGlmIChpc0NvbGdyb3VwICYmICFvcmlnaW5hbCAmJiBjb2xncm91cHMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjb2xncm91cHM6JywgY29sZ3JvdXBzKTtcbiAgICAgICAgICAgIGNvbGdyb3Vwcy5mb3JFYWNoKChjb2xzLCBySW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBncm91cEhlYWQgPSB7fTtcbiAgICAgICAgICAgICAgICBjb2x1bW5zLmZvckVhY2goKGNvbHVtbikgPT4ge1xuICAgICAgICAgICAgICAgICAgICBncm91cEhlYWRbY29sdW1uLnByb3BlcnR5XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29scy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uLmlkID0gY29sdW1uLnByb3BlcnR5O1xuICAgICAgICAgICAgICAgICAgICBjb2x1bW4ucGFyZW50SWQgPSBjb2x1bW4ucGFyYW1zLnBhcmVudElkO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCB7IF9jb2xTcGFuLCBfcm93U3BhbiB9ID0gY29sdW1uXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF9jb2xTcGFuID0gY29sdW1uLmNvbFNwYW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IF9yb3dTcGFuID0gY29sdW1uLnJvd1NwYW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkQ29sdW1uID0gZ2V0VmFsaWRDb2x1bW4oY29sdW1uKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29sdW1uSW5kZXggPSBjb2x1bW5zLmZpbmRJbmRleCgoaXRlbSkgPT4gaXRlbS5rZXkuc3RhcnRzV2l0aCh2YWxpZENvbHVtbi5rZXkpKTtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXBIZWFkW3ZhbGlkQ29sdW1uLnByb3BlcnR5XSA9IG9yaWdpbmFsID8gdmFsaWRDb2x1bW4ucHJvcGVydHkgOiBjb2x1bW4udGl0bGU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChfY29sU3BhbiA+IDEgfHwgX3Jvd1NwYW4gPiAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzaGVldE1lcmdlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzOiB7IHI6IHJJbmRleCwgYzogY29sdW1uSW5kZXggfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlOiB7IHI6IHJJbmRleCArIF9yb3dTcGFuIC0gMSwgYzogY29sdW1uSW5kZXggKyBfY29sU3BhbiAtIDEgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBjb2xMaXN0LnB1c2goZ3JvdXBIZWFkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29sTGlzdC5wdXNoKGNvbEhlYWQpO1xuICAgICAgICB9XG4gICAgICAgIGJlZm9yZVJvd0NvdW50ICs9IGNvbExpc3QubGVuZ3RoO1xuICAgICAgICBjb25zb2xlLmxvZygnY29sTGlzdDonLCBjb2xMaXN0KTtcbiAgICB9XG4gICAgLy8g5aSE55CG5ZCI5bm2XG4gICAgaWYgKGlzTWVyZ2UgJiYgIW9yaWdpbmFsKSB7XG4gICAgICAgIG1lcmdlQ2VsbHMuZm9yRWFjaChtZXJnZUl0ZW0gPT4ge1xuICAgICAgICAgICAgY29uc3QgeyByb3c6IG1lcmdlUm93SW5kZXgsIHJvd3NwYW46IG1lcmdlUm93c3BhbiwgY29sOiBtZXJnZUNvbEluZGV4LCBjb2xzcGFuOiBtZXJnZUNvbHNwYW4gfSA9IG1lcmdlSXRlbTtcbiAgICAgICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgIHM6IHsgcjogbWVyZ2VSb3dJbmRleCArIGJlZm9yZVJvd0NvdW50LCBjOiBtZXJnZUNvbEluZGV4IH0sXG4gICAgICAgICAgICAgICAgZTogeyByOiBtZXJnZVJvd0luZGV4ICsgYmVmb3JlUm93Q291bnQgKyBtZXJnZVJvd3NwYW4gLSAxLCBjOiBtZXJnZUNvbEluZGV4ICsgbWVyZ2VDb2xzcGFuIC0gMSB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IHJvd0xpc3QgPSBkYXRhcy5tYXAoaXRlbSA9PiB7XG4gICAgICAgIGNvbnN0IHJlc3QgPSB7fTtcbiAgICAgICAgY29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgICAgIHJlc3RbY29sdW1uLnByb3BlcnR5XSA9IGdldENlbGxMYWJlbChjb2x1bW4sIGl0ZW0uX3Jvd1tjb2x1bW4ucHJvcGVydHldKTtcbiAgICAgICAgICAgIGNvbHVtbi5pZCA9IGNvbHVtbi5wcm9wZXJ0eTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXN0O1xuICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKCdyb3dMaXN0OicsIHJvd0xpc3QpO1xuICAgIGJlZm9yZVJvd0NvdW50ICs9IHJvd0xpc3QubGVuZ3RoO1xuICAgIC8vIOWkhOeQhuihqOWwvlxuICAgIGlmIChpc0Zvb3Rlcikge1xuICAgICAgICBjb25zdCB7IGZvb3RlckRhdGEgfSA9ICR0YWJsZS5nZXRUYWJsZURhdGEoKTtcbiAgICAgICAgY29uc3QgZm9vdGVycyA9IGdldEZvb3RlckRhdGEob3B0aW9ucywgZm9vdGVyRGF0YSk7XG4gICAgICAgIGNvbnN0IG1lcmdlRm9vdGVySXRlbXMgPSAkdGFibGUuZ2V0TWVyZ2VGb290ZXJJdGVtcygpO1xuICAgICAgICAvLyDlpITnkIblkIjlubZcbiAgICAgICAgaWYgKGlzTWVyZ2UgJiYgIW9yaWdpbmFsKSB7XG4gICAgICAgICAgICBtZXJnZUZvb3Rlckl0ZW1zLmZvckVhY2gobWVyZ2VJdGVtID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHJvdzogbWVyZ2VSb3dJbmRleCwgcm93c3BhbjogbWVyZ2VSb3dzcGFuLCBjb2w6IG1lcmdlQ29sSW5kZXgsIGNvbHNwYW46IG1lcmdlQ29sc3BhbiB9ID0gbWVyZ2VJdGVtO1xuICAgICAgICAgICAgICAgIHNoZWV0TWVyZ2VzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBzOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCwgYzogbWVyZ2VDb2xJbmRleCB9LFxuICAgICAgICAgICAgICAgICAgICBlOiB7IHI6IG1lcmdlUm93SW5kZXggKyBiZWZvcmVSb3dDb3VudCArIG1lcmdlUm93c3BhbiAtIDEsIGM6IG1lcmdlQ29sSW5kZXggKyBtZXJnZUNvbHNwYW4gLSAxIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdmb290ZXJzOicsIGZvb3RlcnMpO1xuICAgICAgICBmb290ZXJzLmZvckVhY2goKHJvd3MpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGl0ZW0gPSB7fTtcbiAgICAgICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIGl0ZW1bY29sdW1uLnByb3BlcnR5XSA9IHJvd3NbaW5kZXhdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBmb290TGlzdC5wdXNoKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgY29uc29sZS5sb2coJ2Zvb3RMaXN0OicsIGZvb3RMaXN0KTtcbiAgICB9XG4gICAgY29uc3QgZXhwb3J0TWV0aG9kID0gKCkgPT4ge1xuICAgICAgICBjb25zdCB3b3JrYm9vayA9IG5ldyBFeGNlbEpTLldvcmtib29rKCk7XG4gICAgICAgIGNvbnN0IHNoZWV0ID0gd29ya2Jvb2suYWRkV29ya3NoZWV0KHNoZWV0TmFtZSk7XG4gICAgICAgIHdvcmtib29rLmNyZWF0b3IgPSAndnhlLXRhYmxlJztcbiAgICAgICAgY29uc29sZS5sb2coJ3NoZWV0Q29sczogJywgc2hlZXRDb2xzKTtcbiAgICAgICAgc2hlZXQuY29sdW1ucyA9IHNoZWV0Q29scztcbiAgICAgICAgY29uc3QgX2NvbHVtbnMgPSBjb2x1bW5zO1xuICAgICAgICBpZiAoaXNIZWFkZXIpIHtcbiAgICAgICAgICAgIGNvbExpc3QuZm9yRWFjaChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBpbiBsaXN0KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChsaXN0W2tleV0gPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wcm90b3R5cGUtYnVpbHRpbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsaXN0Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2xJdGVtID0gY29sdW1ucy5maW5kKChpdGVtKSA9PiBpdGVtLnByb3BlcnR5ID09PSBrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKCdjb2xJdGVtOicsIGNvbEl0ZW0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdFtrZXldID0gbGlzdFtjb2xJdGVtLnBhcmVudElkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2NvbExpc3QyOicsIGNvbExpc3QpO1xuICAgICAgICAgICAgc2hlZXQuYWRkUm93cyhjb2xMaXN0KS5mb3JFYWNoKChleGNlbFJvdywgZUluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsUm93SGVpZ2h0KGV4Y2VsUm93LCByb3dIZWlnaHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXhjZWxSb3c6JywgZXhjZWxSb3cpO1xuICAgICAgICAgICAgICAgIGV4Y2VsUm93LmVhY2hDZWxsKGV4Y2VsQ2VsbCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb2x1bW4gPSBfY29sdW1ucy5maW5kKChpdGVtKSA9PiBleGNlbENvbC5rZXkgPT09IGl0ZW0ucHJvcGVydHkpO1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zdCBjb2x1bW5fcCA9IGNvbGdyb3Vwc1tlSW5kZXhdLmZpbmQoKGl0ZW06IGFueSkgPT4gY29sdW1uLnByb3BlcnR5LnN0YXJ0c1dpdGgoaXRlbS5rZXkpKVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBoZWFkZXJBbGlnbiA9ICdjZW50ZXInO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB7IC8qIGhlYWRlckFsaWduLCAqLyBhbGlnbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbENlbGxTdHlsZShleGNlbENlbGwsIGhlYWRlckFsaWduIHx8IGFsaWduIHx8IGFsbEhlYWRlckFsaWduIHx8IGFsbEFsaWduKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9sZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGw6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3BhdHRlcm4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXR0ZXJuOiAnc29saWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmZ0NvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcmdiOiBkZWZhdWx0SGVhZGVyQmFja2dyb3VuZENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBzaGVldC5hZGRSb3dzKHJvd0xpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgaWYgKHVzZVN0eWxlKSB7XG4gICAgICAgICAgICAgICAgc2V0RXhjZWxSb3dIZWlnaHQoZXhjZWxSb3csIHJvd0hlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBleGNlbFJvdy5lYWNoQ2VsbChleGNlbENlbGwgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGV4Y2VsQ29sID0gc2hlZXQuZ2V0Q29sdW1uKGV4Y2VsQ2VsbC5jb2wpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IF9jb2x1bW5zLmZpbmQoKGl0ZW0pID0+IGl0ZW0ucHJvcGVydHkgPT09IGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhbGlnbiB9ID0gY29sdW1uO1xuICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgYWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBPYmplY3QuYXNzaWduKGV4Y2VsQ2VsbCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFyZ2I6IGRlZmF1bHRDZWxsRm9udENvbG9yXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogZ2V0RGVmYXVsdEJvcmRlclN0eWxlKClcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoaXNGb290ZXIpIHtcbiAgICAgICAgICAgIHNoZWV0LmFkZFJvd3MoZm9vdExpc3QpLmZvckVhY2goZXhjZWxSb3cgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh1c2VTdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBzZXRFeGNlbFJvd0hlaWdodChleGNlbFJvdywgcm93SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZXhjZWxSb3cuZWFjaENlbGwoZXhjZWxDZWxsID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZXhjZWxDb2wgPSBzaGVldC5nZXRDb2x1bW4oZXhjZWxDZWxsLmNvbCk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbHVtbiA9IF9jb2x1bW5zLmZpbmQoKGl0ZW0pID0+IGl0ZW0ucHJvcGVydHkgPT09IGV4Y2VsQ29sLmtleSk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHsgZm9vdGVyQWxpZ24sIGFsaWduIH0gPSBjb2x1bW47XG4gICAgICAgICAgICAgICAgICAgIHNldEV4Y2VsQ2VsbFN0eWxlKGV4Y2VsQ2VsbCwgZm9vdGVyQWxpZ24gfHwgYWxpZ24gfHwgYWxsRm9vdGVyQWxpZ24gfHwgYWxsQWxpZ24pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodXNlU3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE9iamVjdC5hc3NpZ24oZXhjZWxDZWxsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9udDoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnYjogZGVmYXVsdENlbGxGb250Q29sb3JcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyOiBnZXREZWZhdWx0Qm9yZGVyU3R5bGUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1c2VTdHlsZSAmJiBzaGVldE1ldGhvZCkge1xuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lICovXG4gICAgICAgICAgICBzaGVldE1ldGhvZCh7IG9wdGlvbnMsIHdvcmtib29rLCB3b3Jrc2hlZXQ6IHNoZWV0LCBjb2x1bW5zLCBjb2xncm91cHMsIGRhdGFzLCAkdGFibGUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgc2hlZXRNZXJnZXMuZm9yRWFjaCgoeyBzLCBlIH0pID0+IHtcbiAgICAgICAgICAgIHNoZWV0Lm1lcmdlQ2VsbHMocy5yICsgMSwgcy5jICsgMSwgZS5yICsgMSwgZS5jICsgMSk7XG4gICAgICAgIH0pO1xuICAgICAgICB3b3JrYm9vay54bHN4LndyaXRlQnVmZmVyKCkudGhlbihidWZmZXIgPT4ge1xuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUtbmV4dC1saW5lICovXG4gICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtidWZmZXJdLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nIH0pO1xuICAgICAgICAgICAgLy8g5a+85Ye6IHhsc3hcbiAgICAgICAgICAgIGRvd25sb2FkRmlsZShwYXJhbXMsIGJsb2IsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKHNob3dNc2cpIHtcbiAgICAgICAgICAgICAgICBtb2RhbC5jbG9zZShtc2dLZXkpO1xuICAgICAgICAgICAgICAgIG1vZGFsLm1lc3NhZ2UoeyBtZXNzYWdlOiB0KCd2eGUudGFibGUuZXhwU3VjY2VzcycpLCBzdGF0dXM6ICdzdWNjZXNzJyB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICBpZiAoc2hvd01zZykge1xuICAgICAgICBtb2RhbC5tZXNzYWdlKHsgaWQ6IG1zZ0tleSwgbWVzc2FnZTogdCgndnhlLnRhYmxlLmV4cExvYWRpbmcnKSwgc3RhdHVzOiAnbG9hZGluZycsIGR1cmF0aW9uOiAtMSB9KTtcbiAgICAgICAgc2V0VGltZW91dChleHBvcnRNZXRob2QsIDE1MDApO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZXhwb3J0TWV0aG9kKCk7XG4gICAgfVxufVxuZnVuY3Rpb24gZG93bmxvYWRGaWxlKHBhcmFtcywgYmxvYiwgb3B0aW9ucykge1xuICAgIGNvbnN0IHsgJHRhYmxlIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyAkdnhlIH0gPSAkdGFibGU7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBjb25zdCB7IG1lc3NhZ2UsIGZpbGVuYW1lLCB0eXBlIH0gPSBvcHRpb25zO1xuICAgIGNvbnN0IHNob3dNc2cgPSBtZXNzYWdlICE9PSBmYWxzZTtcbiAgICBpZiAod2luZG93LkJsb2IpIHtcbiAgICAgICAgaWYgKG5hdmlnYXRvci5tc1NhdmVCbG9iKSB7XG4gICAgICAgICAgICBuYXZpZ2F0b3IubXNTYXZlQmxvYihibG9iLCBgJHtmaWxlbmFtZX0uJHt0eXBlfWApO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgbGlua0VsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgICAgICAgICBsaW5rRWxlbS50YXJnZXQgPSAnX2JsYW5rJztcbiAgICAgICAgICAgIGxpbmtFbGVtLmRvd25sb2FkID0gYCR7ZmlsZW5hbWV9LiR7dHlwZX1gO1xuICAgICAgICAgICAgbGlua0VsZW0uaHJlZiA9IFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGxpbmtFbGVtKTtcbiAgICAgICAgICAgIGxpbmtFbGVtLmNsaWNrKCk7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGxpbmtFbGVtKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgaWYgKHNob3dNc2cpIHtcbiAgICAgICAgICAgIG1vZGFsLmFsZXJ0KHsgbWVzc2FnZTogdCgndnhlLmVycm9yLm5vdEV4cCcpLCBzdGF0dXM6ICdlcnJvcicgfSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja0ltcG9ydERhdGEodGFibGVGaWVsZHMsIGZpZWxkcykge1xuICAgIHJldHVybiBmaWVsZHMuc29tZShmaWVsZCA9PiB0YWJsZUZpZWxkcy5pbmRleE9mKGZpZWxkKSA+IC0xKTtcbn1cbmZ1bmN0aW9uIGltcG9ydEVycm9yKHBhcmFtcykge1xuICAgIGNvbnN0IHsgJHRhYmxlLCBvcHRpb25zIH0gPSBwYXJhbXM7XG4gICAgY29uc3QgeyAkdnhlLCBfaW1wb3J0UmVqZWN0IH0gPSAkdGFibGU7XG4gICAgY29uc3Qgc2hvd01zZyA9IG9wdGlvbnMubWVzc2FnZSAhPT0gZmFsc2U7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBpZiAoc2hvd01zZykge1xuICAgICAgICBtb2RhbC5tZXNzYWdlKHsgbWVzc2FnZTogdCgndnhlLmVycm9yLmltcEZpZWxkcycpLCBzdGF0dXM6ICdlcnJvcicgfSk7XG4gICAgfVxuICAgIGlmIChfaW1wb3J0UmVqZWN0KSB7XG4gICAgICAgIF9pbXBvcnRSZWplY3QoeyBzdGF0dXM6IGZhbHNlIH0pO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGltcG9ydFhMU1gocGFyYW1zKSB7XG4gICAgY29uc3QgeyAkdGFibGUsIGNvbHVtbnMsIG9wdGlvbnMsIGZpbGUgfSA9IHBhcmFtcztcbiAgICBjb25zdCB7ICR2eGUsIF9pbXBvcnRSZXNvbHZlIH0gPSAkdGFibGU7XG4gICAgY29uc3QgeyBtb2RhbCwgdCB9ID0gJHZ4ZTtcbiAgICBjb25zdCBzaG93TXNnID0gb3B0aW9ucy5tZXNzYWdlICE9PSBmYWxzZTtcbiAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICBmaWxlUmVhZGVyLm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgfTtcbiAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IChldm50KSA9PiB7XG4gICAgICAgIGNvbnN0IHRhYmxlRmllbGRzID0gW107XG4gICAgICAgIGNvbHVtbnMuZm9yRWFjaCgoY29sdW1uKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBmaWVsZCA9IGNvbHVtbi5wcm9wZXJ0eTtcbiAgICAgICAgICAgIGlmIChmaWVsZCkge1xuICAgICAgICAgICAgICAgIHRhYmxlRmllbGRzLnB1c2goZmllbGQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgY29uc3Qgd29ya2Jvb2sgPSBuZXcgRXhjZWxKUy5Xb3JrYm9vaygpO1xuICAgICAgICBjb25zdCByZWFkZXJUYXJnZXQgPSBldm50LnRhcmdldDtcbiAgICAgICAgaWYgKHJlYWRlclRhcmdldCkge1xuICAgICAgICAgICAgd29ya2Jvb2sueGxzeC5sb2FkKHJlYWRlclRhcmdldC5yZXN1bHQpLnRoZW4od2IgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGZpcnN0U2hlZXQgPSB3Yi53b3Jrc2hlZXRzWzBdO1xuICAgICAgICAgICAgICAgIGlmIChmaXJzdFNoZWV0KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHNoZWV0VmFsdWVzID0gZmlyc3RTaGVldC5nZXRTaGVldFZhbHVlcygpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBmaWVsZEluZGV4ID0gWEVVdGlscy5maW5kSW5kZXhPZihzaGVldFZhbHVlcywgKGxpc3QpID0+IGxpc3QgJiYgbGlzdC5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZmllbGRzID0gc2hlZXRWYWx1ZXNbZmllbGRJbmRleF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXR1cyA9IGNoZWNrSW1wb3J0RGF0YSh0YWJsZUZpZWxkcywgZmllbGRzKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHN0YXR1cykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVjb3JkcyA9IHNoZWV0VmFsdWVzLnNsaWNlKGZpZWxkSW5kZXgpLm1hcChsaXN0ID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBpdGVtID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGlzdC5mb3JFYWNoKChjZWxsVmFsdWUsIGNJbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtW2ZpZWxkc1tjSW5kZXhdXSA9IGNlbGxWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCByZWNvcmQgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YWJsZUZpZWxkcy5mb3JFYWNoKGZpZWxkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjb3JkW2ZpZWxkXSA9IFhFVXRpbHMuaXNVbmRlZmluZWQoaXRlbVtmaWVsZF0pID8gbnVsbCA6IGl0ZW1bZmllbGRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWNvcmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICR0YWJsZS5jcmVhdGVEYXRhKHJlY29yZHMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbG9hZFJlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMubW9kZSA9PT0gJ2luc2VydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUuaW5zZXJ0QXQoZGF0YSwgLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9hZFJlc3QgPSAkdGFibGUucmVsb2FkRGF0YShkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvYWRSZXN0LnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoX2ltcG9ydFJlc29sdmUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF9pbXBvcnRSZXNvbHZlKHsgc3RhdHVzOiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzaG93TXNnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kYWwubWVzc2FnZSh7IG1lc3NhZ2U6IHQoJ3Z4ZS50YWJsZS5pbXBTdWNjZXNzJywgW3JlY29yZHMubGVuZ3RoXSksIHN0YXR1czogJ3N1Y2Nlc3MnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaW1wb3J0RXJyb3IocGFyYW1zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGltcG9ydEVycm9yKHBhcmFtcyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGZpbGVSZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG59XG5mdW5jdGlvbiBoYW5kbGVJbXBvcnRFdmVudChwYXJhbXMpIHtcbiAgICBpZiAocGFyYW1zLm9wdGlvbnMudHlwZSA9PT0gJ3hsc3gnKSB7XG4gICAgICAgIGltcG9ydFhMU1gocGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGhhbmRsZUV4cG9ydEV2ZW50KHBhcmFtcykge1xuICAgIGlmIChwYXJhbXMub3B0aW9ucy50eXBlID09PSAneGxzeCcpIHtcbiAgICAgICAgZXhwb3J0WExTWChwYXJhbXMpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuLyoqXG4gKiDln7rkuo4gdnhlLXRhYmxlIOihqOagvOeahOWinuW8uuaPkuS7tu+8jOaUr+aMgeWvvOWHuiB4bHN4IOagvOW8j1xuICovXG5leHBvcnQgY29uc3QgVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYID0ge1xuICAgIGluc3RhbGwodnhldGFibGUpIHtcbiAgICAgICAgY29uc3QgeyBpbnRlcmNlcHRvciB9ID0gdnhldGFibGU7XG4gICAgICAgIHZ4ZXRhYmxlLnNldHVwKHtcbiAgICAgICAgICAgIGV4cG9ydDoge1xuICAgICAgICAgICAgICAgIHR5cGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHhsc3g6IDBcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpbnRlcmNlcHRvci5taXhpbih7XG4gICAgICAgICAgICAnZXZlbnQuaW1wb3J0JzogaGFuZGxlSW1wb3J0RXZlbnQsXG4gICAgICAgICAgICAnZXZlbnQuZXhwb3J0JzogaGFuZGxlRXhwb3J0RXZlbnRcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB3aW5kb3cuVlhFVGFibGUgJiYgd2luZG93LlZYRVRhYmxlLnVzZSkge1xuICAgIHdpbmRvdy5WWEVUYWJsZS51c2UoVlhFVGFibGVQbHVnaW5FeHBvcnRYTFNYKTtcbn1cbmV4cG9ydCBkZWZhdWx0IFZYRVRhYmxlUGx1Z2luRXhwb3J0WExTWDtcbiJdfQ==
