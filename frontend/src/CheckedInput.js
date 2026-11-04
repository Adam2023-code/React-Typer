import React, { useRef, useEffect } from 'react';

const eventTargetValue = e => e.target.value;
const handleTypingEventWith = fn => e => fn(eventTargetValue(e));

const CheckedInput = ({ expectedWord, onInputChange, onWordMatch, onMistake, onCorrectKey }) => {
  const userInput = useRef(null);

  useEffect(() => {
    userInput.current.focus();
  }, [userInput]);

  const handleTypingEvent = handleTypingEventWith((typedWord) => {
    if (typedWord === expectedWord.text) {
      userInput.current.value = '';
      onWordMatch();
    } else if (!expectedWord.text.startsWith(typedWord)) {
      onMistake();
    } else {
      if (onCorrectKey) {
        onCorrectKey();
      }
    }

    onInputChange(userInput.current.value);
  });

  return (
    <>
      <input ref={userInput} defaultValue="" onChange={handleTypingEvent} />
    </>
  );
};

export default CheckedInput;
