/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

interface InputContextValue {
  inputRef: RefObject<HTMLInputElement | null>;
  /** Focus the persistent input. Must be called from inside a user
   *  gesture handler on iOS for the keyboard to actually open. */
  focusInput: () => void;
  /** Blur the persistent input — dismisses the keyboard. */
  blurInput: () => void;
  inputFocused: boolean;
  setInputFocused: (focused: boolean) => void;
  /** Bumps each time a forward keystroke is rejected (wrong character).
   *  PlayingScreen reads this to flash the cursor. */
  rejectTick: number;
  setRejectTick: (n: number | ((prev: number) => number)) => void;
}

const InputContext = createContext<InputContextValue | null>(null);

export function InputProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [rejectTick, setRejectTickRaw] = useState(0);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const blurInput = useCallback(() => {
    inputRef.current?.blur();
  }, []);

  const setRejectTick = useCallback(
    (n: number | ((prev: number) => number)) => {
      setRejectTickRaw((prev) => (typeof n === "function" ? n(prev) : n));
    },
    [],
  );

  return (
    <InputContext.Provider
      value={{
        inputRef,
        focusInput,
        blurInput,
        inputFocused,
        setInputFocused,
        rejectTick,
        setRejectTick,
      }}
    >
      {children}
    </InputContext.Provider>
  );
}

export function useInput() {
  const ctx = useContext(InputContext);
  if (!ctx) throw new Error("useInput must be used within InputProvider");
  return ctx;
}
