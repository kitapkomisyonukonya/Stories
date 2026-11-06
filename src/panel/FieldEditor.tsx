import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import type { Exercise, Level, PageData } from '../types';
import { exerciseFindings, textFindings } from './checks';
import { EXERCISE_TYPES, fieldLabel } from './labels';
import { IconCopy, IconDown, IconPlus, IconTrash, IconUp } from './icons';
import { AutoText, Findings, isArabic } from './ui';
import { pathText, type Path } from './util';

/**
 * The forms of the panel. Any value in a book file can be edited here: texts, lists, groups of
 * fields, exercises. Field names are shown in Turkish (labels.ts); exercises get forms made for
 * their kind, so nobody has to know that a correct answer is "option number 2".
 */

export interface EditContext {
  language: 'en' | 'ar';
  level: Level;
  /** The chapter page the value belongs to, for the "is this exercise about its chapter?" check. */
  page?: PageData;
  /** The place someone clicked in the app: it is opened, scrolled to and briefly lit. */
  focus?: string;
  readOnly?: boolean;
}

type Change = (value: unknown) => void;

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** An empty item shaped like the ones already in a list, for "add". */
export const emptyLike = (value: unknown): unknown => {
  if (typeof value === 'string') return '';
  if (typeof value === 'number') return 0;
  if (typeof value === 'boolean') return false;
  if (Array.isArray(value)) return value.length && typeof value[0] === 'string' ? [''] : [];
  if (isObject(value)) {
    const copy: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) copy[key] = key === 'id' ? `${String(item)}-yeni-${Date.now().toString(36)}` : emptyLike(item);
    return copy;
  }
  return null;
};

const usePathFocus = (ref: RefObject<HTMLElement | null>, path: string, focus?: string) => {
  useEffect(() => {
    if (!focus || !ref.current) return;
    if (focus === path) {
      const element = ref.current;
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      element.classList.remove('flash');
      void element.offsetWidth;
      element.classList.add('flash');
      const input = element.querySelector<HTMLElement>('textarea, input');
      input?.focus({ preventScroll: true });
    }
  }, [focus, path, ref]);
};

export const TextField = ({
  label,
  help,
  value,
  onChange,
  long,
  path,
  ctx,
  checks = true,
  extra,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (value: string) => void;
  long?: boolean;
  path: string;
  ctx: EditContext;
  checks?: boolean;
  extra?: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  usePathFocus(ref, path, ctx.focus);
  const arabic = ctx.language === 'ar' || isArabic(value);
  const multiline = long || value.length > 70 || value.includes('\n');
  return (
    <div className="field" ref={ref} data-path={path}>
      <span className="field-label">
        {label}
        {extra}
      </span>
      {multiline ? (
        <AutoText value={value} onChange={onChange} aria-label={label} disabled={ctx.readOnly} dir={arabic ? 'rtl' : undefined} className={arabic ? 'ar' : undefined} />
      ) : (
        <input type="text" value={value} aria-label={label} onChange={event => onChange(event.target.value)} disabled={ctx.readOnly} dir={arabic ? 'rtl' : undefined} className={arabic ? 'ar' : undefined} />
      )}
      {help && <small>{help}</small>}
      {checks && <Findings findings={textFindings(value, ctx.language)} />}
    </div>
  );
};

const ListTools = ({
  index,
  length,
  onMove,
  onCopy,
  onRemove,
  readOnly,
  what,
}: {
  index: number;
  length: number;
  onMove: (to: number) => void;
  onCopy?: () => void;
  onRemove: () => void;
  readOnly?: boolean;
  what: string;
}) => (
  <span className="tools">
    <button type="button" className="icon-btn" title="Yukarı taşı" aria-label={`${what} yukarı taşı`} disabled={readOnly || index === 0} onClick={() => onMove(index - 1)}>
      <IconUp size={16} />
    </button>
    <button type="button" className="icon-btn" title="Aşağı taşı" aria-label={`${what} aşağı taşı`} disabled={readOnly || index === length - 1} onClick={() => onMove(index + 1)}>
      <IconDown size={16} />
    </button>
    {onCopy && (
      <button type="button" className="icon-btn" title="Kopyasını ekle" aria-label={`${what} kopyala`} disabled={readOnly} onClick={onCopy}>
        <IconCopy size={16} />
      </button>
    )}
    <button type="button" className="icon-btn danger" title="Sil" aria-label={`${what} sil`} disabled={readOnly} onClick={onRemove}>
      <IconTrash size={16} />
    </button>
  </span>
);

const move = <T,>(list: T[], from: number, to: number): T[] => {
  const copy = [...list];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

const itemTitle = (value: unknown, index: number) => {
  if (isObject(value)) {
    const name = value.title ?? value.word ?? value.question ?? value.left ?? value.group ?? value.sentence ?? value.chapter ?? value.name ?? value.text ?? value.criterion ?? value.label;
    if (typeof name === 'string' && name.trim()) return `${index + 1}. ${name.length > 60 ? `${name.slice(0, 58)}…` : name}`;
  }
  return `${index + 1}.`;
};

export const StringList = ({
  label,
  help,
  value,
  onChange,
  path,
  ctx,
  addLabel = 'Madde ekle',
  long,
}: {
  label: string;
  help?: string;
  value: string[];
  onChange: (value: string[]) => void;
  path: string;
  ctx: EditContext;
  addLabel?: string;
  long?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  usePathFocus(ref, path, ctx.focus);
  return (
    <div className="field" ref={ref} data-path={path}>
      <span className="field-label">{label}</span>
      {help && <small>{help}</small>}
      {value.map((item, index) => (
        <div key={index} className="answer-row" data-path={`${path}.${index}`}>
          <span className="muted small" style={{ width: 18, textAlign: 'right' }}>
            {index + 1}
          </span>
          <ItemText value={item} onChange={next => onChange(value.map((old, at) => (at === index ? next : old)))} path={`${path}.${index}`} ctx={ctx} long={long} label={`${label} ${index + 1}`} />
          <ListTools
            index={index}
            length={value.length}
            what={`${index + 1}. madde`}
            readOnly={ctx.readOnly}
            onMove={to => onChange(move(value, index, to))}
            onRemove={() => onChange(value.filter((_, at) => at !== index))}
          />
        </div>
      ))}
      <div>
        <button type="button" className="btn small" disabled={ctx.readOnly} onClick={() => onChange([...value, ''])}>
          <IconPlus size={15} /> {addLabel}
        </button>
      </div>
      <Findings findings={value.flatMap(item => textFindings(item, ctx.language))} />
    </div>
  );
};

const ItemText = ({ value, onChange, path, ctx, long, label }: { value: string; onChange: (value: string) => void; path: string; ctx: EditContext; long?: boolean; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  usePathFocus(ref, path, ctx.focus);
  const arabic = ctx.language === 'ar' || isArabic(value);
  return (
    <div className="grow" ref={ref}>
      {long || value.length > 60 ? (
        <AutoText value={value} onChange={onChange} minRows={1} aria-label={label} disabled={ctx.readOnly} className={arabic ? 'ar' : undefined} />
      ) : (
        <input type="text" value={value} aria-label={label} onChange={event => onChange(event.target.value)} disabled={ctx.readOnly} dir={arabic ? 'rtl' : undefined} className={arabic ? 'ar' : undefined} />
      )}
    </div>
  );
};

export const ObjectList = ({
  label,
  value,
  onChange,
  path,
  ctx,
  render,
  addLabel = 'Ekle',
  template,
  openAll,
}: {
  label: string;
  value: unknown[];
  onChange: (value: unknown[]) => void;
  path: string;
  ctx: EditContext;
  render: (item: unknown, change: Change, itemPath: string, index: number) => ReactNode;
  addLabel?: string;
  template?: () => unknown;
  openAll?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  usePathFocus(ref, path, ctx.focus);
  const inside = (index: number) => Boolean(ctx.focus && (ctx.focus === `${path}.${index}` || ctx.focus.startsWith(`${path}.${index}.`)));
  return (
    <div className="field" ref={ref} data-path={path}>
      <span className="field-label">
        {label} <span className="chip">{value.length}</span>
      </span>
      {value.map((item, index) => (
        <details key={index} className="box nested" open={openAll || value.length <= 2 || inside(index)} data-path={`${path}.${index}`}>
          <summary>
            <span className="grow">{itemTitle(item, index)}</span>
            <ListTools
              index={index}
              length={value.length}
              what={itemTitle(item, index)}
              readOnly={ctx.readOnly}
              onMove={to => onChange(move(value, index, to))}
              onCopy={() => onChange([...value.slice(0, index + 1), JSON.parse(JSON.stringify(item)) as unknown, ...value.slice(index + 1)])}
              onRemove={() => onChange(value.filter((_, at) => at !== index))}
            />
          </summary>
          {render(item, next => onChange(value.map((old, at) => (at === index ? next : old))), `${path}.${index}`, index)}
        </details>
      ))}
      <div>
        <button
          type="button"
          className="btn small"
          disabled={ctx.readOnly}
          onClick={() => onChange([...value, template ? template() : emptyLike(value[value.length - 1] ?? {})])}
        >
          <IconPlus size={15} /> {addLabel}
        </button>
      </div>
    </div>
  );
};

/** Any value: the panel picks the right form by its shape and its field name. */
export const ValueEditor = ({ name, value, onChange, path, ctx }: { name: string; value: unknown; onChange: Change; path: string; ctx: EditContext }) => {
  const meta = fieldLabel(name);
  if (meta.hidden) return null;
  if (typeof value === 'string') return <TextField label={meta.label} help={meta.help} value={value} onChange={onChange} long={meta.long} path={path} ctx={ctx} />;
  if (typeof value === 'number') {
    return (
      <label className="field" data-path={path}>
        <span>{meta.label}</span>
        <input type="number" value={value} onChange={event => onChange(Number(event.target.value))} disabled={ctx.readOnly} />
        {meta.help && <small>{meta.help}</small>}
      </label>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <label className="answer-row" data-path={path}>
        <input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} disabled={ctx.readOnly} />
        <span>{meta.label}</span>
        {meta.help && <small className="muted">{meta.help}</small>}
      </label>
    );
  }
  if (Array.isArray(value)) {
    if (name === 'exercises' || name === 'languageFocusExercises' || name === 'quizQuestions') {
      return <ExerciseList name={name} value={value as Exercise[]} onChange={onChange} path={path} ctx={ctx} />;
    }
    if (value.every(item => typeof item === 'string')) {
      return <StringList label={meta.label} help={meta.help} value={value as string[]} onChange={onChange} path={path} ctx={ctx} long={meta.long} />;
    }
    return (
      <ObjectList
        label={meta.label}
        value={value}
        onChange={onChange}
        path={path}
        ctx={ctx}
        render={(item, change, itemPath) => <ValueEditor name={`${name}[]`} value={item} onChange={change} path={itemPath} ctx={ctx} />}
      />
    );
  }
  if (isObject(value)) return <ObjectFields value={value} onChange={onChange} path={path} ctx={ctx} title={name.endsWith('[]') ? undefined : meta.label} />;
  if (value === null || value === undefined) return null;
  return null;
};

export const ObjectFields = ({
  value,
  onChange,
  path,
  ctx,
  title,
  skip = [],
}: {
  value: Record<string, unknown>;
  onChange: Change;
  path: string;
  ctx: EditContext;
  title?: string;
  skip?: string[];
}) => {
  const ref = useRef<HTMLDivElement>(null);
  usePathFocus(ref, path, ctx.focus);
  const body = Object.entries(value)
    .filter(([key]) => !skip.includes(key))
    .map(([key, item]) => (
      <ValueEditor key={key} name={key} value={item} onChange={next => onChange({ ...value, [key]: next })} path={path ? `${path}.${key}` : key} ctx={ctx} />
    ));
  if (!title) return <div ref={ref}>{body}</div>;
  return (
    <div className="box nested" ref={ref} data-path={path}>
      <div className="box-head">
        <b>{title}</b>
      </div>
      {body}
    </div>
  );
};

// --- exercises -------------------------------------------------------------------------------

export const EXERCISE_TEMPLATES: Record<string, () => Partial<Exercise>> = {
  'multiple-choice': () => ({ question: '', options: ['', '', ''], correctAnswer: 0 }),
  'true-false': () => ({ question: '', correctAnswer: true }),
  matching: () => ({ matchingHeadings: { left: '', right: '' }, matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }, { left: '', right: '' }], correctAnswer: {} }),
  sequencing: () => ({ sequencingItems: [{ id: '1', text: '' }, { id: '2', text: '' }, { id: '3', text: '' }], correctAnswer: ['1', '2', '3'] }),
  'fill-blanks': () => ({ fillBlanksText: '… [blank] …', correctAnswer: [''] }),
  'word-bank': () => ({ fillBlanksText: '… [blank] … [blank] …', wordBank: ['', '', ''], correctAnswer: ['', ''] }),
  'drag-drop': () => ({ dragDropGroups: [{ group: '', items: [''] }, { group: '', items: [''] }], correctAnswer: {} }),
  'choose-form': () => ({ formChoices: [{ sentence: '… [choice] …', options: ['', '', ''], answer: 0 }], correctAnswer: null }),
  'error-correction': () => ({ errorItems: [{ sentence: '', error: '', options: ['', '', ''], answer: 0 }], correctAnswer: null }),
  'sentence-building': () => ({ sentenceChunks: ['', '', ''], correctAnswer: null }),
  transformation: () => ({ transformItems: [{ source: '', frame: '… [blank] …', answers: [''] }], correctAnswer: null }),
  reflection: () => ({ discussionPrompts: [{ question: '', mode: 'pair', example: '' }], correctAnswer: null }),
};

export const newExercise = (type: string, idPrefix: string): Exercise =>
  ({
    id: `${idPrefix}-${Date.now().toString(36)}`,
    type,
    title: '',
    instructions: '',
    question: '',
    ...(EXERCISE_TEMPLATES[type]?.() ?? {}),
    explanation: '',
    feedback: { correct: '', incorrect: '' },
  }) as Exercise;

const ExerciseList = ({ name, value, onChange, path, ctx }: { name: string; value: Exercise[]; onChange: Change; path: string; ctx: EditContext }) => {
  const meta = fieldLabel(name);
  const prefix = value[0]?.id?.replace(/-\d+$|-[a-z0-9]+$/, '') ?? 'panel';
  return (
    <ObjectList
      label={meta.label}
      value={value}
      onChange={onChange}
      path={path}
      ctx={ctx}
      addLabel="Etkinlik ekle"
      template={() => newExercise(value[0]?.type ?? 'multiple-choice', prefix)}
      render={(item, change, itemPath) => <ExerciseEditor exercise={item as Exercise} onChange={change} path={itemPath} ctx={ctx} />}
    />
  );
};

const KNOWN_EXERCISE_KEYS = new Set([
  'id',
  'type',
  'title',
  'instructions',
  'question',
  'options',
  'correctAnswer',
  'explanation',
  'feedback',
  'matchingPairs',
  'matchingHeadings',
  'sequencingItems',
  'fillBlanksText',
  'wordBank',
  'dragDropGroups',
  'formChoices',
  'errorItems',
  'sentenceChunks',
  'transformItems',
  'discussionPrompts',
]);

export const ExerciseEditor = ({ exercise, onChange, path, ctx }: { exercise: Exercise; onChange: Change; path: string; ctx: EditContext }) => {
  const set = (patch: Partial<Exercise>) => onChange({ ...exercise, ...patch });
  const type = EXERCISE_TYPES[exercise.type] ?? { name: exercise.type, help: '' };
  const words = (exercise.instructions ?? '').trim().split(/\s+/).filter(Boolean).length;
  const limit = ({ A1: 8, A2: 12, B1: 16, B2: 20 } as Record<string, number>)[ctx.level] ?? 20;
  const findings = ctx.page ? exerciseFindings(exercise, ctx.page, ctx.level, ctx.language) : [];
  const text = (key: keyof Exercise, label: string, help?: string, long?: boolean) =>
    typeof exercise[key] === 'string' || exercise[key] === undefined ? (
      <TextField label={label} help={help} value={String(exercise[key] ?? '')} onChange={next => set({ [key]: next } as Partial<Exercise>)} path={`${path}.${String(key)}`} ctx={ctx} long={long} />
    ) : null;

  return (
    <div>
      <div className="row wrap" style={{ marginBottom: 10 }}>
        <span className="chip gold">{type.name}</span>
        <span className="small muted grow">{type.help}</span>
      </div>
      <Findings findings={findings} />
      {text('title', 'Başlık')}
      <TextField
        label="Yönerge"
        value={exercise.instructions ?? ''}
        onChange={next => set({ instructions: next })}
        path={`${path}.instructions`}
        ctx={ctx}
        checks={false}
        extra={ctx.language === 'en' ? <span className={`chip ${words > limit ? 'bad' : 'good'}`}>{`${words} / ${limit} kelime`}</span> : undefined}
      />
      {text('question', 'Soru', undefined, true)}
      <AnswerEditor exercise={exercise} set={set} path={path} ctx={ctx} />
      {text('explanation', 'Açıklama', 'İkinci denemeden sonra öğrenciye gösterilir.', true)}
      {isObject(exercise.feedback) && (
        <div className="grid two">
          <TextField label="Doğru cevapta" value={exercise.feedback.correct ?? ''} onChange={next => set({ feedback: { ...exercise.feedback, correct: next } })} path={`${path}.feedback.correct`} ctx={ctx} />
          <TextField label="Yanlış cevapta" value={exercise.feedback.incorrect ?? ''} onChange={next => set({ feedback: { ...exercise.feedback, incorrect: next } })} path={`${path}.feedback.incorrect`} ctx={ctx} />
        </div>
      )}
      {Object.entries(exercise)
        .filter(([key]) => !KNOWN_EXERCISE_KEYS.has(key))
        .map(([key, item]) => (
          <ValueEditor key={key} name={key} value={item} onChange={next => set({ [key]: next } as Partial<Exercise>)} path={`${path}.${key}`} ctx={ctx} />
        ))}
    </div>
  );
};

const AnswerEditor = ({ exercise, set, path, ctx }: { exercise: Exercise; set: (patch: Partial<Exercise>) => void; path: string; ctx: EditContext }) => {
  const radioName = `${path}-answer`;
  switch (exercise.type) {
    case 'multiple-choice': {
      const options = exercise.options ?? [];
      return (
        <div className="field" data-path={`${path}.options`}>
          <span className="field-label">Seçenekler · doğru olanı işaretleyin</span>
          {options.map((option, index) => (
            <div className="answer-row" key={index}>
              <input type="radio" name={radioName} checked={exercise.correctAnswer === index} onChange={() => set({ correctAnswer: index })} aria-label={`${index + 1}. seçenek doğru`} disabled={ctx.readOnly} />
              <ItemText value={option} onChange={next => set({ options: options.map((old, at) => (at === index ? next : old)) })} path={`${path}.options.${index}`} ctx={ctx} label={`${index + 1}. seçenek`} />
              <button
                type="button"
                className="icon-btn danger"
                aria-label={`${index + 1}. seçeneği sil`}
                disabled={ctx.readOnly || options.length <= 2}
                onClick={() => {
                  const next = options.filter((_, at) => at !== index);
                  const answer = Number(exercise.correctAnswer);
                  set({ options: next, correctAnswer: answer === index ? 0 : answer > index ? answer - 1 : answer });
                }}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
          <div>
            <button type="button" className="btn small" disabled={ctx.readOnly} onClick={() => set({ options: [...options, ''] })}>
              <IconPlus size={15} /> Seçenek ekle
            </button>
          </div>
        </div>
      );
    }
    case 'true-false':
      return (
        <div className="field">
          <span className="field-label">Doğru cevap</span>
          <div className="seg" role="group" aria-label="Doğru cevap">
            <button type="button" aria-pressed={exercise.correctAnswer === true} onClick={() => set({ correctAnswer: true })} disabled={ctx.readOnly}>
              Doğru (True)
            </button>
            <button type="button" aria-pressed={exercise.correctAnswer === false} onClick={() => set({ correctAnswer: false })} disabled={ctx.readOnly}>
              Yanlış (False)
            </button>
          </div>
        </div>
      );
    case 'matching': {
      const pairs = exercise.matchingPairs ?? [];
      const update = (next: { left: string; right: string }[]) => set({ matchingPairs: next, correctAnswer: Object.fromEntries(next.map(pair => [pair.left, pair.right])) });
      return (
        <>
          {exercise.matchingHeadings && (
            <div className="grid two">
              <TextField label="Sol sütun başlığı" value={exercise.matchingHeadings.left} onChange={next => set({ matchingHeadings: { ...exercise.matchingHeadings!, left: next } })} path={`${path}.matchingHeadings.left`} ctx={ctx} />
              <TextField label="Sağ sütun başlığı" value={exercise.matchingHeadings.right} onChange={next => set({ matchingHeadings: { ...exercise.matchingHeadings!, right: next } })} path={`${path}.matchingHeadings.right`} ctx={ctx} />
            </div>
          )}
          <div className="field" data-path={`${path}.matchingPairs`}>
            <span className="field-label">Eşleşen çiftler · her satır bir doğru eşleşme</span>
            {pairs.map((pair, index) => (
              <div className="answer-row" key={index}>
                <ItemText value={pair.left} onChange={next => update(pairs.map((old, at) => (at === index ? { ...old, left: next } : old)))} path={`${path}.matchingPairs.${index}.left`} ctx={ctx} label={`${index + 1}. sol`} />
                <span className="muted">↔</span>
                <ItemText value={pair.right} onChange={next => update(pairs.map((old, at) => (at === index ? { ...old, right: next } : old)))} path={`${path}.matchingPairs.${index}.right`} ctx={ctx} label={`${index + 1}. sağ`} />
                <button type="button" className="icon-btn danger" aria-label={`${index + 1}. çifti sil`} disabled={ctx.readOnly} onClick={() => update(pairs.filter((_, at) => at !== index))}>
                  <IconTrash size={16} />
                </button>
              </div>
            ))}
            <div>
              <button type="button" className="btn small" disabled={ctx.readOnly} onClick={() => update([...pairs, { left: '', right: '' }])}>
                <IconPlus size={15} /> Çift ekle
              </button>
            </div>
          </div>
        </>
      );
    }
    case 'sequencing': {
      const items = exercise.sequencingItems ?? [];
      const update = (texts: string[]) => {
        const next = texts.map((text, index) => ({ id: String(index + 1), text }));
        set({ sequencingItems: next, correctAnswer: next.map(item => item.id) });
      };
      return (
        <StringList
          label="Olaylar · doğru sırayla yazın"
          help="Uygulama olayları karıştırıp gösterir; öğrenci bu sıraya koyar."
          value={items.map(item => item.text)}
          onChange={update}
          path={`${path}.sequencingItems`}
          ctx={ctx}
          addLabel="Olay ekle"
        />
      );
    }
    case 'drag-drop': {
      const groups = exercise.dragDropGroups ?? [];
      const update = (next: { group: string; items: string[] }[]) => set({ dragDropGroups: next, correctAnswer: Object.fromEntries(next.map(group => [group.group, group.items])) });
      return (
        <ObjectList
          label="Gruplar · her maddeyi doğru grubuna yazın"
          value={groups}
          onChange={next => update(next as { group: string; items: string[] }[])}
          path={`${path}.dragDropGroups`}
          ctx={ctx}
          addLabel="Grup ekle"
          openAll
          template={() => ({ group: '', items: [''] })}
          render={(item, change, itemPath) => {
            const group = item as { group: string; items: string[] };
            return (
              <>
                <TextField label="Grup adı" value={group.group} onChange={next => change({ ...group, group: next })} path={`${itemPath}.group`} ctx={ctx} />
                <StringList label="Bu gruptaki maddeler" value={group.items} onChange={next => change({ ...group, items: next })} path={`${itemPath}.items`} ctx={ctx} />
              </>
            );
          }}
        />
      );
    }
    case 'fill-blanks':
      return (
        <>
          <TextField label="Boşluklu metin" help="Boşluğu [blank] diye yazın." value={exercise.fillBlanksText ?? ''} onChange={next => set({ fillBlanksText: next })} path={`${path}.fillBlanksText`} ctx={ctx} long />
          <StringList
            label="Kabul edilen cevaplar"
            help="Boşluğa yazılabilecek bütün doğru kelimeler."
            value={(Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer : [exercise.correctAnswer ?? '']).map(String)}
            onChange={next => set({ correctAnswer: next })}
            path={`${path}.correctAnswer`}
            ctx={ctx}
            addLabel="Cevap ekle"
          />
        </>
      );
    case 'word-bank':
      return (
        <>
          <TextField label="Boşluklu metin" help="Her boşluğu [blank] diye yazın." value={exercise.fillBlanksText ?? ''} onChange={next => set({ fillBlanksText: next })} path={`${path}.fillBlanksText`} ctx={ctx} long />
          <StringList
            label="Doğru cevaplar · boşluk sırasıyla"
            value={(Array.isArray(exercise.correctAnswer) ? exercise.correctAnswer : []).map(String)}
            onChange={next => set({ correctAnswer: next })}
            path={`${path}.correctAnswer`}
            ctx={ctx}
            addLabel="Cevap ekle"
          />
          <StringList
            label="Kelime bankası"
            help="Doğru cevapların hepsi ve en az bir fazladan kelime."
            value={exercise.wordBank ?? []}
            onChange={next => set({ wordBank: next })}
            path={`${path}.wordBank`}
            ctx={ctx}
            addLabel="Kelime ekle"
          />
        </>
      );
    case 'choose-form':
    case 'error-correction': {
      const key = exercise.type === 'choose-form' ? 'formChoices' : 'errorItems';
      const items = ((exercise[key] ?? []) as { sentence: string; options: string[]; answer: number; error?: string }[]) ?? [];
      return (
        <ObjectList
          label={exercise.type === 'choose-form' ? 'Cümleler · [choice] yerine doğru biçim seçilir' : 'Hatalı cümleler'}
          value={items}
          onChange={next => set({ [key]: next } as Partial<Exercise>)}
          path={`${path}.${key}`}
          ctx={ctx}
          addLabel="Cümle ekle"
          template={() => (exercise.type === 'choose-form' ? { sentence: '… [choice] …', options: ['', '', ''], answer: 0 } : { sentence: '', error: '', options: ['', '', ''], answer: 0 })}
          render={(item, change, itemPath, itemIndex) => {
            const entry = item as { sentence: string; options: string[]; answer: number; error?: string };
            return (
              <>
                <TextField label="Cümle" value={entry.sentence} onChange={next => change({ ...entry, sentence: next })} path={`${itemPath}.sentence`} ctx={ctx} long />
                {exercise.type === 'error-correction' && (
                  <TextField label="Hatalı kısım" help="Cümlede birebir geçmeli." value={entry.error ?? ''} onChange={next => change({ ...entry, error: next })} path={`${itemPath}.error`} ctx={ctx} />
                )}
                <div className="field">
                  <span className="field-label">{exercise.type === 'choose-form' ? 'Seçenekler · doğru olanı işaretleyin' : 'Düzeltme seçenekleri · doğru olanı işaretleyin'}</span>
                  {entry.options.map((option, index) => (
                    <div className="answer-row" key={index}>
                      <input type="radio" name={`${radioName}-${itemIndex}`} checked={entry.answer === index} onChange={() => change({ ...entry, answer: index })} aria-label={`${index + 1}. seçenek doğru`} disabled={ctx.readOnly} />
                      <ItemText value={option} onChange={next => change({ ...entry, options: entry.options.map((old, at) => (at === index ? next : old)) })} path={`${itemPath}.options.${index}`} ctx={ctx} label={`${index + 1}. seçenek`} />
                    </div>
                  ))}
                </div>
              </>
            );
          }}
        />
      );
    }
    case 'sentence-building':
      return (
        <StringList
          label="Parçalar · doğru sırayla yazın"
          help="Uygulama parçaları karıştırır; öğrenci cümleyi kurar."
          value={exercise.sentenceChunks ?? []}
          onChange={next => set({ sentenceChunks: next })}
          path={`${path}.sentenceChunks`}
          ctx={ctx}
          addLabel="Parça ekle"
        />
      );
    case 'transformation':
      return (
        <ObjectList
          label="Dönüştürülecek cümleler"
          value={exercise.transformItems ?? []}
          onChange={next => set({ transformItems: next as Exercise['transformItems'] })}
          path={`${path}.transformItems`}
          ctx={ctx}
          addLabel="Cümle ekle"
          template={() => ({ source: '', frame: '… [blank] …', answers: [''] })}
          render={(item, change, itemPath) => {
            const entry = item as { source: string; frame: string; answers: string[] };
            return (
              <>
                <TextField label="Hikâyedeki cümle" value={entry.source} onChange={next => change({ ...entry, source: next })} path={`${itemPath}.source`} ctx={ctx} long />
                <TextField label="Yeni cümle" help="Boşluğu [blank] diye yazın." value={entry.frame} onChange={next => change({ ...entry, frame: next })} path={`${itemPath}.frame`} ctx={ctx} long />
                <StringList label="Kabul edilen cevaplar" value={entry.answers} onChange={next => change({ ...entry, answers: next })} path={`${itemPath}.answers`} ctx={ctx} addLabel="Cevap ekle" />
              </>
            );
          }}
        />
      );
    case 'reflection':
      return (
        <ObjectList
          label="Sorular"
          value={exercise.discussionPrompts ?? []}
          onChange={next => set({ discussionPrompts: next as Exercise['discussionPrompts'] })}
          path={`${path}.discussionPrompts`}
          ctx={ctx}
          addLabel="Soru ekle"
          template={() => ({ question: '', mode: 'pair', example: '' })}
          render={(item, change, itemPath) => <ObjectFields value={item as Record<string, unknown>} onChange={change} path={itemPath} ctx={ctx} />}
        />
      );
    default: {
      const rest = Object.fromEntries(Object.entries(exercise).filter(([key]) => ['options', 'correctAnswer'].includes(key)));
      return Object.keys(rest).length ? <ObjectFields value={rest} onChange={next => set(next as Partial<Exercise>)} path={path} ctx={ctx} /> : null;
    }
  }
};

export const pathOf = (path: Path) => pathText(path);
