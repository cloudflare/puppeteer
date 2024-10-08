/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Protocol} from 'devtools-protocol';

import {Dialog as BaseDialog} from '../api/Dialog.js';

import {CDPSession} from './Connection.js';

/**
 * @internal
 */
export class CDPDialog extends BaseDialog {
  #client: CDPSession;

  /**
   * @internal
   */
  constructor(
    client: CDPSession,
    type: Protocol.Page.DialogType,
    message: string,
    defaultValue = ''
  ) {
    super(type, message, defaultValue);
    this.#client = client;
  }

  /**
   * @internal
   */
  override async sendCommand(options: {
    accept: boolean;
    text?: string;
  }): Promise<void> {
    await this.#client.send('Page.handleJavaScriptDialog', {
      accept: options.accept,
      promptText: options.text,
    });
  }
}
