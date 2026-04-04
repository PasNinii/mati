import { Injectable } from '@angular/core';
import { Scenario } from '../models/scenario.model';

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  serialize(scenario: Scenario): string {
    return JSON.stringify(scenario, null, 2);
  }

  deserialize(json: string): Scenario {
    const parsed = JSON.parse(json);
    this.validate(parsed);
    return parsed as Scenario;
  }

  download(scenario: Scenario): void {
    const json = this.serialize(scenario);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name || 'scenario'}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  upload(): Promise<Scenario> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';

      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const scenario = this.deserialize(reader.result as string);
            resolve(scenario);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      };

      input.click();
    });
  }

  private validate(obj: unknown): void {
    const s = obj as Partial<Scenario>;
    if (!s.name || typeof s.name !== 'string') {
      throw new Error('Invalid scenario: missing name');
    }
    if (!s.courtConfig) {
      throw new Error('Invalid scenario: missing courtConfig');
    }
    if (typeof s.duration !== 'number' || s.duration <= 0) {
      throw new Error('Invalid scenario: invalid duration');
    }
    if (!Array.isArray(s.entities) || s.entities.length === 0) {
      throw new Error('Invalid scenario: missing entities');
    }
    if (!Array.isArray(s.keyframes) || s.keyframes.length === 0) {
      throw new Error('Invalid scenario: missing keyframes');
    }
  }
}
