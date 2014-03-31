-include sysdeps/$(shell uname).inc

VERSION=0.1
CXXFLAGS?=-Wall -O3 -ggdb -I.  -pthread -MMD -MP  $(CXX2011FLAGS) # -Wno-unused-local-typedefs 
CFLAGS=-Wall -I.  -O3 -MMD -MP
LDFLAGS=$(CXX2011FLAGS) -pthread   # -Wl,-Bstatic -lstdc++ -lgcc -lz -Wl,-Bdynamic -static-libgcc -lm -lc
# CHEAT_ARG := $(shell ./update-git-hash-if-necessary)

SHIPPROGRAMS=metronome
PROGRAMS=$(SHIPPROGRAMS) 

all: $(PROGRAMS)

-include *.d

.PHONY:	check

metronome: metronome.o reqresp.o iputils.o statstorage.o 
	$(CXX) $(LDFLAGS) $^ -o $@

install: metronome
	mkdir -p $(DESTDIR)/usr/bin/
	mkdir -p $(DESTDIR)/usr/share/doc/metronome
	install -s $(SHIPPROGRAMS) $(DESTDIR)/usr/bin/

clean:
	rm -f *~ *.o *.d $(PROGRAMS) githash.h 

package: all
	rm -rf dist
	DESTDIR=dist make install
	fpm -s dir -f -t rpm -n antonie -v 1.g$(shell cat githash) -C dist .
	fpm -s dir -f -t deb -n antonie -v 1.g$(shell cat githash) -C dist .	
	rm -rf dist

codedocs: codedocs/html/index.html

codedocs/html/index.html: 	
	doxygen

check: testrunner
	./testrunner

testrunner: test-misc_hh.o test-dnamisc_cc.o test-saminfra_cc.o testrunner.o misc.o dnamisc.o saminfra.o zstuff.o fastq.o hash.o
	$(CXX) $^ -lboost_unit_test_framework -lz -o $@ 
