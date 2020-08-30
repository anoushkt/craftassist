/**
 *
 * @license
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 */

/**
 * @fileoverview This file contains a function to initialise the right-click
 * menu of custom blocks and add saving and tagging options to it.
 */

import saveBlockCallback from './rightClickCallbacks/saveBlockCallback';
import tagBlockCallback from './rightClickCallbacks/tagBlockCallback';

const customInit = (block) => {
  const menuCustomizer = (menu) => {
    const saveOption = {
      text: 'Save by name',
      enabled: true,
      callback: () => saveBlockCallback(block),
    };
    menu.push(saveOption);

    const tagOption = {
      text: 'Save by tag',
      enabled: true,
      callback: () => tagBlockCallback(block),
    };
    menu.push(tagOption);

    return menu;
  };
  block.customContextMenu = menuCustomizer;
};

export default customInit;
